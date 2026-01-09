-- ========================================
-- COMPLETE DATABASE SETUP FOR FOOTBALL SCHOOL
-- ========================================

-- 1. DROP existing tables (if any) to start fresh
DROP TABLE IF EXISTS attendance_records CASCADE;
DROP TABLE IF EXISTS attendance CASCADE;
DROP TABLE IF EXISTS receipts CASCADE;
DROP TABLE IF EXISTS payments CASCADE;
DROP TABLE IF EXISTS students CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- 2. Create USERS table
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    username VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL CHECK (role IN ('admin', 'trainer')),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- 3. Create STUDENTS table
CREATE TABLE IF NOT EXISTS students (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    rg TEXT,
    birth_date TEXT,
    responsible TEXT NOT NULL,
    responsible_cpf TEXT,
    responsible_email TEXT,
    father_phone TEXT,
    mother_phone TEXT,
    monthly_value INTEGER NOT NULL DEFAULT 100,
    is_active BOOLEAN DEFAULT true,
    class_schedule TEXT CHECK (class_schedule IN ('18:00-19:30', '19:30-21:00')),
    class_days TEXT[] DEFAULT ARRAY[]::TEXT[],
    photo TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- 4. Create PAYMENTS table
CREATE TABLE IF NOT EXISTS payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    month TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'Em Aberto' CHECK (status IN ('Pago', 'Não Pagou', 'Bolsista', 'AFASTADO', 'Novo', 'Cobrado', 'Adiado', 'Em Aberto')),
    value INTEGER NOT NULL,
    receipt TEXT,
    paid_at TEXT,
    postponed_to TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(student_id, month)
);

-- 5. Create ATTENDANCE table
CREATE TABLE IF NOT EXISTS attendance (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    date TEXT NOT NULL,
    day_of_week TEXT NOT NULL CHECK (day_of_week IN ('Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta')),
    class_schedule TEXT NOT NULL CHECK (class_schedule IN ('18:00-19:30', '19:30-21:00')),
    class_days TEXT[] DEFAULT ARRAY[]::TEXT[],
    trainer_name TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- 6. Create ATTENDANCE_RECORDS table
CREATE TABLE IF NOT EXISTS attendance_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    attendance_id UUID NOT NULL REFERENCES attendance(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    status TEXT NOT NULL CHECK (status IN ('Presente', 'Ausente')),
    created_at TIMESTAMP DEFAULT NOW()
);

-- 7. Create RECEIPTS table (for file storage)
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

-- 8. Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_students_name ON students(name);
CREATE INDEX IF NOT EXISTS idx_students_active ON students(is_active);
CREATE INDEX IF NOT EXISTS idx_students_class ON students(class_schedule);
CREATE INDEX IF NOT EXISTS idx_payments_student ON payments(student_id);
CREATE INDEX IF NOT EXISTS idx_payments_month ON payments(month);
CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status);
CREATE INDEX IF NOT EXISTS idx_attendance_date ON attendance(date);
CREATE INDEX IF NOT EXISTS idx_attendance_schedule ON attendance(class_schedule);
CREATE INDEX IF NOT EXISTS idx_attendance_records_attendance ON attendance_records(attendance_id);
CREATE INDEX IF NOT EXISTS idx_attendance_records_student ON attendance_records(student_id);

-- 9. Insert default users
INSERT INTO users (name, username, password_hash, role)
VALUES 
    ('Administrador', 'admin', 'admin123', 'admin'),
    ('João da Silva', 'treinador', 'treinador123', 'trainer'),
    ('Maria Santos', 'treinador2', 'treinador123', 'trainer')
ON CONFLICT (username) DO NOTHING;

-- 10. Enable RLS on sensitive tables
ALTER TABLE receipts ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- 11. Create RLS policies
DROP POLICY IF EXISTS "Enable read receipts" ON receipts;
CREATE POLICY "Enable read receipts" ON receipts FOR SELECT USING (true);

DROP POLICY IF EXISTS "Enable insert receipts" ON receipts;
CREATE POLICY "Enable insert receipts" ON receipts FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Enable read access to users" ON users;
CREATE POLICY "Enable read access to users" ON users FOR SELECT USING (true);

-- 12. Sample data summary
SELECT 
    'Setup completo!' as status,
    (SELECT COUNT(*) FROM students) as total_alunos,
    (SELECT COUNT(*) FROM students WHERE is_active = true) as alunos_ativos,
    (SELECT COUNT(*) FROM payments) as total_pagamentos,
    (SELECT COUNT(*) FROM attendance) as total_chamadas,
    (SELECT COUNT(*) FROM users) as total_usuarios;
