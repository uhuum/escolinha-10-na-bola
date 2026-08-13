-- ====================================================
-- COMPLETE DATABASE SETUP FOR ESCOLINHA 10 NA BOLA
-- ====================================================
-- This script will drop and recreate all tables with proper structure
-- Execute this in Supabase SQL Editor

-- ====================================================
-- 1. DROP EXISTING TABLES (BE CAREFUL - THIS DELETES ALL DATA!)
-- ====================================================

DROP TABLE IF EXISTS receipts CASCADE;
DROP TABLE IF EXISTS attendance_records CASCADE;
DROP TABLE IF EXISTS attendance CASCADE;
DROP TABLE IF EXISTS payments CASCADE;
DROP TABLE IF EXISTS students CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- ====================================================
-- 2. CREATE USERS TABLE
-- ====================================================

CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  username VARCHAR(255) NOT NULL UNIQUE,
  name VARCHAR(255) NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role VARCHAR(50) NOT NULL CHECK (role IN ('admin', 'trainer', 'coordinator')),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create index for faster lookups
CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_users_role ON users(role);

-- ====================================================
-- 3. CREATE STUDENTS TABLE
-- ====================================================

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
  photo TEXT,
  is_active BOOLEAN DEFAULT true,
  is_scholarship BOOLEAN DEFAULT false,
  class_schedule TEXT CHECK (class_schedule IN ('18:00-19:30', '19:30-21:00')),
  class_days TEXT[] DEFAULT '{}',
  registration_date TEXT DEFAULT TO_CHAR(NOW(), 'YYYY-MM-DD'),
  archived_at TEXT,
  archive_reason TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX idx_students_name ON students(name);
CREATE INDEX idx_students_is_active ON students(is_active);
CREATE INDEX idx_students_class_schedule ON students(class_schedule);
CREATE INDEX idx_students_registration_date ON students(registration_date);

-- ====================================================
-- 4. CREATE PAYMENTS TABLE
-- ====================================================

CREATE TABLE payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  month TEXT NOT NULL,
  month_number INTEGER NOT NULL CHECK (month_number >= 1 AND month_number <= 12),
  year_number INTEGER NOT NULL CHECK (year_number >= 2024),
  status TEXT NOT NULL CHECK (status IN ('Pago', 'Não Pagou', 'Bolsista', 'AFASTADO', 'Novo', 'Cobrado', 'Adiado', 'Em Aberto')),
  value INTEGER NOT NULL DEFAULT 0,
  due_date TEXT NOT NULL,
  paid_at TEXT,
  charged_at TEXT,
  postponed_to TEXT,
  receipt TEXT,
  payment_type TEXT CHECK (payment_type IN ('dinheiro', 'pix')),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(student_id, month_number, year_number)
);

-- Create indexes for payment queries
CREATE INDEX idx_payments_student_id ON payments(student_id);
CREATE INDEX idx_payments_month_year ON payments(month_number, year_number);
CREATE INDEX idx_payments_status ON payments(status);
CREATE INDEX idx_payments_due_date ON payments(due_date);

-- ====================================================
-- 5. CREATE ATTENDANCE TABLE
-- ====================================================

CREATE TABLE attendance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  date TEXT NOT NULL,
  day_of_week TEXT NOT NULL,
  class_schedule TEXT NOT NULL CHECK (class_schedule IN ('18:00-19:30', '19:30-21:00')),
  class_days TEXT[] DEFAULT '{}',
  trainer_name TEXT NOT NULL,
  trainer_id UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes for attendance queries
CREATE INDEX idx_attendance_date ON attendance(date);
CREATE INDEX idx_attendance_class_schedule ON attendance(class_schedule);
CREATE INDEX idx_attendance_trainer_id ON attendance(trainer_id);

-- ====================================================
-- 6. CREATE ATTENDANCE_RECORDS TABLE
-- ====================================================

CREATE TABLE attendance_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  attendance_id UUID NOT NULL REFERENCES attendance(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  status TEXT NOT NULL CHECK (status IN ('Presente', 'Ausente')),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes for attendance record queries
CREATE INDEX idx_attendance_records_attendance_id ON attendance_records(attendance_id);
CREATE INDEX idx_attendance_records_student_id ON attendance_records(student_id);
CREATE INDEX idx_attendance_records_status ON attendance_records(status);

-- ====================================================
-- 7. CREATE RECEIPTS TABLE
-- ====================================================

CREATE TABLE receipts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  payment_id UUID NOT NULL REFERENCES payments(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  file_name VARCHAR(255) NOT NULL,
  file_path VARCHAR(500) NOT NULL,
  file_url VARCHAR(500) NOT NULL,
  uploaded_at TIMESTAMP DEFAULT NOW(),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes for receipt queries
CREATE INDEX idx_receipts_payment_id ON receipts(payment_id);
CREATE INDEX idx_receipts_student_id ON receipts(student_id);

-- ====================================================
-- 8. ENABLE ROW LEVEL SECURITY (RLS)
-- ====================================================

-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE students ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE receipts ENABLE ROW LEVEL SECURITY;

-- ====================================================
-- 9. CREATE RLS POLICIES
-- ====================================================

-- USERS TABLE POLICIES
CREATE POLICY "Enable read access to users"
  ON users FOR SELECT
  TO authenticated
  USING (true);

-- STUDENTS TABLE POLICIES
CREATE POLICY "Enable read access to students"
  ON students FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Enable insert for students"
  ON students FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Enable update for students"
  ON students FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Enable delete for students"
  ON students FOR DELETE
  TO authenticated
  USING (true);

-- PAYMENTS TABLE POLICIES
CREATE POLICY "Enable read access to payments"
  ON payments FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Enable insert for payments"
  ON payments FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Enable update for payments"
  ON payments FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Enable delete for payments"
  ON payments FOR DELETE
  TO authenticated
  USING (true);

-- ATTENDANCE TABLE POLICIES
CREATE POLICY "Enable read access to attendance"
  ON attendance FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Enable insert for attendance"
  ON attendance FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Enable update for attendance"
  ON attendance FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Enable delete for attendance"
  ON attendance FOR DELETE
  TO authenticated
  USING (true);

-- ATTENDANCE_RECORDS TABLE POLICIES
CREATE POLICY "Enable read access to attendance_records"
  ON attendance_records FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Enable insert for attendance_records"
  ON attendance_records FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Enable update for attendance_records"
  ON attendance_records FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Enable delete for attendance_records"
  ON attendance_records FOR DELETE
  TO authenticated
  USING (true);

-- RECEIPTS TABLE POLICIES
CREATE POLICY "Enable read receipts"
  ON receipts FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Enable insert receipts"
  ON receipts FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- ====================================================
-- 10. CREATE STORAGE BUCKET FOR RECEIPTS (if not exists)
-- ====================================================

-- Note: This needs to be run separately in Supabase Storage UI or via API
-- Bucket name: receipts
-- Public: false
-- Allowed MIME types: image/*, application/pdf

-- ====================================================
-- 11. CREATE UPDATED_AT TRIGGER FUNCTION
-- ====================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply trigger to tables with updated_at
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

-- ====================================================
-- 12. INSERT DEFAULT ADMIN USER
-- ====================================================
-- Default password: admin123 (CHANGE THIS IN PRODUCTION!)
-- Password hash for 'admin123' using bcrypt

INSERT INTO users (username, name, password_hash, role)
VALUES 
  ('admin', 'Administrador', '$2a$10$vI8aWBnW3fID.ZQ4/zo1G.q1lRps.9cGLcZEiGDMVr5yUP1KUOYTa', 'admin')
ON CONFLICT (username) DO NOTHING;

-- ====================================================
-- SETUP COMPLETE!
-- ====================================================

-- Verify tables were created
SELECT 
  schemaname,
  tablename,
  tableowner
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY tablename;

-- Verify RLS is enabled
SELECT 
  tablename,
  rowsecurity AS rls_enabled
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY tablename;
