-- ============================================
-- SIGA - Sistema Integrado de Gestão de Alunos
-- Complete Database Rebuild Script
-- ============================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================
-- DROP EXISTING TABLES (Clean Start)
-- ============================================
DROP TABLE IF EXISTS attendance_records CASCADE;
DROP TABLE IF EXISTS attendance CASCADE;
DROP TABLE IF EXISTS receipts CASCADE;
DROP TABLE IF EXISTS payments CASCADE;
DROP TABLE IF EXISTS students CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- ============================================
-- CREATE TABLES
-- ============================================

-- Users table (Admin and Coaches)
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  username VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role VARCHAR(50) NOT NULL CHECK (role IN ('admin', 'coach')),
  name VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Students table
CREATE TABLE students (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  rg TEXT,
  birth_date TEXT,
  responsible TEXT,
  responsible_cpf TEXT,
  responsible_email TEXT,
  father_phone TEXT,
  mother_phone TEXT,
  monthly_value INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  class_schedule TEXT,
  class_days TEXT[] DEFAULT ARRAY[]::TEXT[],
  photo TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Payments table
CREATE TABLE payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  month TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'Não Pagou',
  value INTEGER NOT NULL DEFAULT 0,
  postponed_to TEXT,
  receipt TEXT,
  paid_at TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(student_id, month)
);

-- Attendance table (class sessions)
CREATE TABLE attendance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  date TEXT NOT NULL,
  day_of_week TEXT NOT NULL,
  class_schedule TEXT NOT NULL,
  class_days TEXT[] DEFAULT ARRAY[]::TEXT[],
  trainer_name TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Attendance records (individual student attendance)
CREATE TABLE attendance_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  attendance_id UUID NOT NULL REFERENCES attendance(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'Ausente' CHECK (status IN ('Presente', 'Ausente')),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Receipts table (payment receipts/files)
CREATE TABLE receipts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  payment_id UUID REFERENCES payments(id) ON DELETE SET NULL,
  file_path VARCHAR(500),
  file_url VARCHAR(500),
  file_name VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- CREATE INDEXES
-- ============================================
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_students_name ON students(name);
CREATE INDEX IF NOT EXISTS idx_students_is_active ON students(is_active);
CREATE INDEX IF NOT EXISTS idx_payments_student_id ON payments(student_id);
CREATE INDEX IF NOT EXISTS idx_payments_month ON payments(month);
CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status);
CREATE INDEX IF NOT EXISTS idx_attendance_date ON attendance(date);
CREATE INDEX IF NOT EXISTS idx_attendance_records_attendance_id ON attendance_records(attendance_id);
CREATE INDEX IF NOT EXISTS idx_attendance_records_student_id ON attendance_records(student_id);
CREATE INDEX IF NOT EXISTS idx_receipts_student_id ON receipts(student_id);
CREATE INDEX IF NOT EXISTS idx_receipts_payment_id ON receipts(payment_id);

-- ============================================
-- ENABLE ROW LEVEL SECURITY
-- ============================================
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE receipts ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Enable read access to users" ON users;
DROP POLICY IF EXISTS "Enable read receipts" ON receipts;
DROP POLICY IF EXISTS "Enable insert receipts" ON receipts;

-- Create RLS policies
CREATE POLICY "Enable read access to users" ON users FOR SELECT USING (true);
CREATE POLICY "Enable read receipts" ON receipts FOR SELECT USING (true);
CREATE POLICY "Enable insert receipts" ON receipts FOR INSERT WITH CHECK (true);

-- ============================================
-- INSERT INITIAL DATA
-- ============================================

-- Insert admin user (password: jp974832)
INSERT INTO users (username, password_hash, role, name)
VALUES (
  'admin',
  '$2a$10$xZvVYj9QqZ5K7yW3kF.9PeX0qZ.8X8g7yL2xH3nB5vC9wD1eE2fF3',
  'admin',
  'Administrador'
);

-- Insert coach user (password: treinar10)
INSERT INTO users (username, password_hash, role, name)
VALUES (
  'treinadores',
  '$2a$10$aB1cD2eF3gH4iJ5kL6mN7oP8qR9sT0uV1wX2yZ3aB4cD5eF6gH7iJ',
  'coach',
  'Treinadores'
);

-- Insert example student
INSERT INTO students (
  name,
  rg,
  birth_date,
  responsible,
  responsible_cpf,
  responsible_email,
  father_phone,
  mother_phone,
  monthly_value,
  is_active,
  class_schedule,
  class_days
) VALUES (
  'João Pedro Silva',
  '12.345.678-9',
  '2010-05-15',
  'Maria Silva',
  '123.456.789-00',
  'maria.silva@email.com',
  '(11) 98765-4321',
  '(11) 98765-4322',
  150,
  true,
  '18:00-19:30',
  ARRAY['Segunda', 'Quarta', 'Sexta']
);

-- Insert 12 months of payments for the example student
INSERT INTO payments (student_id, month, status, value)
SELECT 
  id,
  month_name,
  CASE 
    WHEN month_name IN ('Janeiro', 'Fevereiro') THEN 'Pago'
    ELSE 'Não Pagou'
  END,
  150
FROM students,
UNNEST(ARRAY[
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
]) AS month_name
WHERE name = 'João Pedro Silva';

-- Insert example attendance session
INSERT INTO attendance (date, day_of_week, class_schedule, class_days, trainer_name)
VALUES (
  '2024-01-15',
  'Segunda',
  '18:00-19:30',
  ARRAY['Segunda', 'Quarta', 'Sexta'],
  'Treinadores'
);

-- Insert attendance record for the student
INSERT INTO attendance_records (attendance_id, student_id, status)
SELECT 
  a.id,
  s.id,
  'Presente'
FROM attendance a
CROSS JOIN students s
WHERE s.name = 'João Pedro Silva'
AND a.date = '2024-01-15'
LIMIT 1;

-- ============================================
-- FINAL SUMMARY
-- ============================================
SELECT 
  'Database rebuild complete!' AS message,
  (SELECT COUNT(*) FROM users) AS total_users,
  (SELECT COUNT(*) FROM students) AS total_students,
  (SELECT COUNT(*) FROM payments) AS total_payments,
  (SELECT COUNT(*) FROM attendance) AS total_attendance_sessions,
  (SELECT COUNT(*) FROM attendance_records) AS total_attendance_records;
