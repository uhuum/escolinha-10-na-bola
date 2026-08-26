-- ============================================================
-- SCRIPT SEGURO PARA MIGRAÇÃO EM PRODUÇÃO
-- Este script adiciona colunas e tabelas que faltam SEM apagar dados
-- Todas as operações usam IF NOT EXISTS ou verificações de existência
-- ============================================================

-- ============================================================
-- 1. COLUNAS NA TABELA STUDENTS
-- ============================================================

-- Adiciona coluna is_scholarship se não existir
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'students' AND column_name = 'is_scholarship') THEN
        ALTER TABLE students ADD COLUMN is_scholarship BOOLEAN DEFAULT false;
    END IF;
END $$;

-- Adiciona coluna archived_at se não existir
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'students' AND column_name = 'archived_at') THEN
        ALTER TABLE students ADD COLUMN archived_at TEXT;
    END IF;
END $$;

-- Adiciona coluna archive_reason se não existir
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'students' AND column_name = 'archive_reason') THEN
        ALTER TABLE students ADD COLUMN archive_reason TEXT;
    END IF;
END $$;

-- Adiciona coluna registration_date se não existir
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'students' AND column_name = 'registration_date') THEN
        ALTER TABLE students ADD COLUMN registration_date TEXT;
    END IF;
END $$;

-- Adiciona coluna schedule_configs (JSONB) se não existir
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'students' AND column_name = 'schedule_configs') THEN
        ALTER TABLE students ADD COLUMN schedule_configs JSONB;
    END IF;
END $$;

-- Adiciona coluna days_per_week se não existir
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'students' AND column_name = 'days_per_week') THEN
        ALTER TABLE students ADD COLUMN days_per_week INTEGER DEFAULT 2;
    END IF;
END $$;

-- ============================================================
-- 2. COLUNAS NA TABELA PAYMENTS
-- ============================================================

-- Adiciona coluna payment_type se não existir
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'payments' AND column_name = 'payment_type') THEN
        ALTER TABLE payments ADD COLUMN payment_type TEXT;
    END IF;
END $$;

-- Adiciona coluna charged_at se não existir
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'payments' AND column_name = 'charged_at') THEN
        ALTER TABLE payments ADD COLUMN charged_at TEXT;
    END IF;
END $$;

-- Adiciona coluna due_date se não existir
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'payments' AND column_name = 'due_date') THEN
        ALTER TABLE payments ADD COLUMN due_date TEXT;
    END IF;
END $$;

-- Adiciona coluna month_number se não existir
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'payments' AND column_name = 'month_number') THEN
        ALTER TABLE payments ADD COLUMN month_number INTEGER;
    END IF;
END $$;

-- Adiciona coluna year_number se não existir
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'payments' AND column_name = 'year_number') THEN
        ALTER TABLE payments ADD COLUMN year_number INTEGER;
    END IF;
END $$;

-- ============================================================
-- 3. COLUNAS NA TABELA ATTENDANCE
-- ============================================================

-- Adiciona coluna trainer_id se não existir
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'attendance' AND column_name = 'trainer_id') THEN
        ALTER TABLE attendance ADD COLUMN trainer_id UUID;
    END IF;
END $$;

-- ============================================================
-- 4. TABELA USERS (se não existir)
-- ============================================================

CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    username VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL CHECK (role IN ('admin', 'trainer', 'coach')),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Adiciona constraint para aceitar 'coach' como role se ainda não existir
DO $$
BEGIN
    -- Remove a constraint antiga se existir
    IF EXISTS (SELECT 1 FROM information_schema.table_constraints 
               WHERE constraint_name = 'users_role_check' AND table_name = 'users') THEN
        ALTER TABLE users DROP CONSTRAINT users_role_check;
    END IF;
    
    -- Adiciona a nova constraint que aceita admin, trainer e coach
    ALTER TABLE users ADD CONSTRAINT users_role_check 
        CHECK (role IN ('admin', 'trainer', 'coach'));
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

-- ============================================================
-- 5. TABELA RECEIPTS (se não existir)
-- ============================================================

CREATE TABLE IF NOT EXISTS receipts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    payment_id UUID REFERENCES payments(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    file_name VARCHAR(255),
    file_path VARCHAR(500),
    file_url VARCHAR(500),
    uploaded_at TIMESTAMP DEFAULT NOW(),
    created_at TIMESTAMP DEFAULT NOW()
);

-- ============================================================
-- 6. ÍNDICES (apenas se não existirem)
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_students_name ON students(name);
CREATE INDEX IF NOT EXISTS idx_students_active ON students(is_active);
CREATE INDEX IF NOT EXISTS idx_students_class ON students(class_schedule);
CREATE INDEX IF NOT EXISTS idx_students_scholarship ON students(is_scholarship);
CREATE INDEX IF NOT EXISTS idx_payments_student ON payments(student_id);
CREATE INDEX IF NOT EXISTS idx_payments_month ON payments(month);
CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status);
CREATE INDEX IF NOT EXISTS idx_payments_month_year ON payments(month_number, year_number);
CREATE INDEX IF NOT EXISTS idx_attendance_date ON attendance(date);
CREATE INDEX IF NOT EXISTS idx_attendance_schedule ON attendance(class_schedule);
CREATE INDEX IF NOT EXISTS idx_attendance_trainer ON attendance(trainer_id);
CREATE INDEX IF NOT EXISTS idx_attendance_records_attendance ON attendance_records(attendance_id);
CREATE INDEX IF NOT EXISTS idx_attendance_records_student ON attendance_records(student_id);

-- ============================================================
-- 7. INSERIR USUÁRIOS PADRÃO (se não existirem)
-- ============================================================

INSERT INTO users (name, username, password_hash, role)
VALUES 
    ('Administrador', 'admin', 'admin123', 'admin'),
    ('João da Silva', 'treinador', 'treinador123', 'coach'),
    ('Maria Santos', 'treinador2', 'treinador123', 'coach')
ON CONFLICT (username) DO NOTHING;

-- ============================================================
-- 8. HABILITAR RLS (Row Level Security) - se necessário
-- ============================================================

-- Verifica e habilita RLS na tabela receipts
DO $$
BEGIN
    ALTER TABLE receipts ENABLE ROW LEVEL SECURITY;
EXCEPTION
    WHEN others THEN NULL;
END $$;

-- Verifica e habilita RLS na tabela users
DO $$
BEGIN
    ALTER TABLE users ENABLE ROW LEVEL SECURITY;
EXCEPTION
    WHEN others THEN NULL;
END $$;

-- ============================================================
-- 9. POLÍTICAS RLS (apenas se não existirem)
-- ============================================================

-- Política para leitura de receipts
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Enable read receipts' AND tablename = 'receipts') THEN
        CREATE POLICY "Enable read receipts" ON receipts FOR SELECT USING (true);
    END IF;
END $$;

-- Política para inserção de receipts
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Enable insert receipts' AND tablename = 'receipts') THEN
        CREATE POLICY "Enable insert receipts" ON receipts FOR INSERT WITH CHECK (true);
    END IF;
END $$;

-- Política para leitura de users
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Enable read access to users' AND tablename = 'users') THEN
        CREATE POLICY "Enable read access to users" ON users FOR SELECT USING (true);
    END IF;
END $$;

-- ============================================================
-- 10. ATUALIZAR CONSTRAINT DE STATUS DOS PAGAMENTOS
-- ============================================================

DO $$
BEGIN
    -- Remove a constraint antiga se existir
    IF EXISTS (SELECT 1 FROM information_schema.table_constraints 
               WHERE constraint_name = 'payments_status_check' AND table_name = 'payments') THEN
        ALTER TABLE payments DROP CONSTRAINT payments_status_check;
    END IF;
    
    -- Adiciona a nova constraint com todos os status possíveis
    ALTER TABLE payments ADD CONSTRAINT payments_status_check 
        CHECK (status IN ('Pago', 'Não Pagou', 'Bolsista', 'AFASTADO', 'Novo', 'Cobrado', 'Adiado', 'Em Aberto', 'Isento'));
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

-- ============================================================
-- 11. RESUMO DA MIGRAÇÃO
-- ============================================================

SELECT 
    'Migração concluída com sucesso!' as status,
    (SELECT COUNT(*) FROM students) as total_alunos,
    (SELECT COUNT(*) FROM students WHERE is_active = true) as alunos_ativos,
    (SELECT COUNT(*) FROM payments) as total_pagamentos,
    (SELECT COUNT(*) FROM attendance) as total_chamadas,
    (SELECT COUNT(*) FROM users) as total_usuarios;
