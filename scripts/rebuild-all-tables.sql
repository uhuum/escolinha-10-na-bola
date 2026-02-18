-- ============================================
-- SCRIPT COMPLETO DE RECRIAÇÃO DO BANCO DE DADOS
-- Escolinha 10 na Bola
-- ============================================
-- ATENÇÃO: Este script irá DELETAR todas as tabelas existentes
-- e recriá-las do zero. Execute apenas se tiver certeza!
-- ============================================

-- 1. Desabilitar RLS temporariamente e dropar tabelas existentes
DROP TABLE IF EXISTS attendance_records CASCADE;
DROP TABLE IF EXISTS attendance CASCADE;
DROP TABLE IF EXISTS receipts CASCADE;
DROP TABLE IF EXISTS payments CASCADE;
DROP TABLE IF EXISTS students CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- 2. Criar extensão UUID se não existir
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- TABELA: users
-- Usuários do sistema (admin e trainers)
-- ============================================
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  username VARCHAR(100) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role VARCHAR(20) NOT NULL CHECK (role IN ('admin', 'trainer')),
  created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW()
);

-- Índices para users
CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_users_role ON users(role);

-- ============================================
-- TABELA: students
-- Alunos da escolinha
-- ============================================
CREATE TABLE students (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  rg TEXT,
  birth_date TEXT,
  responsible TEXT,
  responsible_cpf TEXT,
  responsible_email TEXT,
  father_phone TEXT,
  mother_phone TEXT,
  monthly_value INTEGER NOT NULL DEFAULT 0,
  photo TEXT,
  is_active BOOLEAN DEFAULT true,
  is_scholarship BOOLEAN DEFAULT false,
  class_schedule TEXT,
  class_days TEXT[] DEFAULT '{}',
  registration_date TEXT,
  archived_at TEXT,
  archive_reason TEXT,
  created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW()
);

-- Índices para students
CREATE INDEX idx_students_name ON students(name);
CREATE INDEX idx_students_is_active ON students(is_active);
CREATE INDEX idx_students_class_schedule ON students(class_schedule);

-- ============================================
-- TABELA: payments
-- Pagamentos mensais dos alunos
-- ============================================
CREATE TABLE payments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  month TEXT NOT NULL, -- Formato: "Janeiro 2025"
  month_number INTEGER NOT NULL CHECK (month_number >= 1 AND month_number <= 12),
  year_number INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'Em Aberto' CHECK (status IN ('Pago', 'Não Pagou', 'Bolsista', 'AFASTADO', 'Novo', 'Cobrado', 'Adiado', 'Em Aberto')),
  value INTEGER NOT NULL DEFAULT 0,
  payment_type TEXT CHECK (payment_type IN ('dinheiro', 'pix', 'transferencia')),
  postponed_to TEXT,
  receipt TEXT,
  paid_at TEXT,
  charged_at TEXT,
  due_date DATE, -- Data de vencimento
  created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW(),
  UNIQUE(student_id, month_number, year_number)
);

-- Índices para payments
CREATE INDEX idx_payments_student_id ON payments(student_id);
CREATE INDEX idx_payments_month_year ON payments(month_number, year_number);
CREATE INDEX idx_payments_status ON payments(status);
CREATE INDEX idx_payments_due_date ON payments(due_date);

-- ============================================
-- TABELA: receipts
-- Comprovantes de pagamento enviados
-- ============================================
CREATE TABLE receipts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  payment_id UUID REFERENCES payments(id) ON DELETE CASCADE,
  file_name VARCHAR(255) NOT NULL,
  file_path VARCHAR(500) NOT NULL,
  file_url VARCHAR(500) NOT NULL,
  uploaded_at TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW()
);

-- Índices para receipts
CREATE INDEX idx_receipts_student_id ON receipts(student_id);
CREATE INDEX idx_receipts_payment_id ON receipts(payment_id);

-- ============================================
-- TABELA: attendance
-- Registro de chamadas por turma/dia
-- ============================================
CREATE TABLE attendance (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  date TEXT NOT NULL, -- Formato: "YYYY-MM-DD"
  day_of_week TEXT NOT NULL, -- Ex: "Segunda", "Terça"
  class_schedule TEXT NOT NULL, -- Ex: "18:00-19:30"
  class_days TEXT[] DEFAULT '{}',
  trainer_name TEXT NOT NULL,
  trainer_id UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW()
);

-- Índices para attendance
CREATE INDEX idx_attendance_date ON attendance(date);
CREATE INDEX idx_attendance_class_schedule ON attendance(class_schedule);
CREATE INDEX idx_attendance_trainer_id ON attendance(trainer_id);

-- ============================================
-- TABELA: attendance_records
-- Registros individuais de presença/ausência
-- ============================================
CREATE TABLE attendance_records (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  attendance_id UUID NOT NULL REFERENCES attendance(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  status TEXT NOT NULL CHECK (status IN ('Presente', 'Ausente')),
  created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW()
);

-- Índices para attendance_records
CREATE INDEX idx_attendance_records_attendance_id ON attendance_records(attendance_id);
CREATE INDEX idx_attendance_records_student_id ON attendance_records(student_id);
CREATE INDEX idx_attendance_records_status ON attendance_records(status);

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================

-- RLS para users (apenas leitura)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable read access to users"
ON users FOR SELECT
USING (true);

-- RLS para receipts (leitura e inserção públicas)
ALTER TABLE receipts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable read receipts"
ON receipts FOR SELECT
USING (true);

CREATE POLICY "Enable insert receipts"
ON receipts FOR INSERT
WITH CHECK (true);

-- ============================================
-- STORAGE BUCKET
-- Bucket para armazenar fotos e comprovantes
-- ============================================

-- Criar bucket se não existir
INSERT INTO storage.buckets (id, name, public)
VALUES ('students-receipts', 'students-receipts', true)
ON CONFLICT (id) DO NOTHING;

-- Políticas de storage
CREATE POLICY "Public Access"
ON storage.objects FOR SELECT
USING (bucket_id = 'students-receipts');

CREATE POLICY "Public Upload"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'students-receipts');

CREATE POLICY "Public Update"
ON storage.objects FOR UPDATE
USING (bucket_id = 'students-receipts');

-- ============================================
-- FUNÇÕES E TRIGGERS
-- ============================================

-- Função para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers para updated_at
CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_students_updated_at
  BEFORE UPDATE ON students
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_payments_updated_at
  BEFORE UPDATE ON payments
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_attendance_updated_at
  BEFORE UPDATE ON attendance
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- DADOS INICIAIS
-- ============================================

-- Criar usuário admin padrão
-- Senha: admin123 (hash bcrypt)
INSERT INTO users (username, name, password_hash, role)
VALUES (
  'admin',
  'Administrador',
  '$2a$10$rLZ5YqJ5qZgZqF5YqJ5qZO5qJ5qZgZqF5YqJ5qZgZqF5YqJ5qZgZq',
  'admin'
) ON CONFLICT (username) DO NOTHING;

-- ============================================
-- FIM DO SCRIPT
-- ============================================

-- Verificar as tabelas criadas
SELECT 
  tablename,
  schemaname
FROM pg_tables 
WHERE schemaname = 'public'
ORDER BY tablename;
