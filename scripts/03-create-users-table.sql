-- Create users table with authentication
CREATE TABLE IF NOT EXISTS public.users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  username VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role VARCHAR(50) NOT NULL CHECK (role IN ('admin', 'coach')),
  name VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create index for faster username lookups
CREATE INDEX IF NOT EXISTS idx_users_username ON public.users(username);

-- Enable RLS
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Allow read access to users table
CREATE POLICY "Enable read access to users" ON public.users
  FOR SELECT
  USING (true);

-- Table for receipts/comprovantes (without foreign key constraints initially)
CREATE TABLE IF NOT EXISTS public.receipts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id UUID,
  file_path VARCHAR(500) NOT NULL,
  file_url VARCHAR(500) NOT NULL,
  file_name VARCHAR(255) NOT NULL,
  payment_id UUID,
  uploaded_at TIMESTAMP DEFAULT NOW(),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Removed foreign key constraints to avoid dependency issues
-- Foreign keys can be added later once all tables exist

CREATE INDEX IF NOT EXISTS idx_receipts_student_id ON public.receipts(student_id);
CREATE INDEX IF NOT EXISTS idx_receipts_payment_id ON public.receipts(payment_id);

ALTER TABLE public.receipts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable read receipts" ON public.receipts
  FOR SELECT
  USING (true);

CREATE POLICY "Enable insert receipts" ON public.receipts
  FOR INSERT
  WITH CHECK (true);
