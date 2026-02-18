-- Create students table
CREATE TABLE IF NOT EXISTS public.students (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  birth_date DATE NOT NULL,
  category TEXT NOT NULL,
  phone TEXT,
  email TEXT,
  enrollment_date DATE DEFAULT CURRENT_DATE,
  status TEXT DEFAULT 'active',
  photo_url TEXT,
  registration_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  is_scholarship BOOLEAN DEFAULT false,
  archived BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create payments table
CREATE TABLE IF NOT EXISTS public.payments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  month INTEGER NOT NULL,
  year INTEGER NOT NULL,
  amount DECIMAL(10, 2) NOT NULL DEFAULT 0,
  status TEXT DEFAULT 'pending',
  payment_date DATE,
  receipt_url TEXT,
  notes TEXT,
  is_charged BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(student_id, month, year)
);

-- Create attendance table
CREATE TABLE IF NOT EXISTS public.attendance (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  present BOOLEAN NOT NULL DEFAULT true,
  trainer_id UUID,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(student_id, date)
);

-- Create users table
CREATE TABLE IF NOT EXISTS public.users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  name TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('admin', 'trainer')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Enable read access for all authenticated users" ON public.students;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON public.students;
DROP POLICY IF EXISTS "Enable update for authenticated users" ON public.students;
DROP POLICY IF EXISTS "Enable delete for authenticated users" ON public.students;

DROP POLICY IF EXISTS "Enable read access for all authenticated users" ON public.payments;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON public.payments;
DROP POLICY IF EXISTS "Enable update for authenticated users" ON public.payments;
DROP POLICY IF EXISTS "Enable delete for authenticated users" ON public.payments;

DROP POLICY IF EXISTS "Enable read access for all authenticated users" ON public.attendance;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON public.attendance;
DROP POLICY IF EXISTS "Enable update for authenticated users" ON public.attendance;
DROP POLICY IF EXISTS "Enable delete for authenticated users" ON public.attendance;

DROP POLICY IF EXISTS "Enable read access for all authenticated users" ON public.users;

-- Create RLS policies for students
CREATE POLICY "Enable read access for all authenticated users"
  ON public.students FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Enable insert for authenticated users"
  ON public.students FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Enable update for authenticated users"
  ON public.students FOR UPDATE
  TO authenticated
  USING (true);

CREATE POLICY "Enable delete for authenticated users"
  ON public.students FOR DELETE
  TO authenticated
  USING (true);

-- Create RLS policies for payments
CREATE POLICY "Enable read access for all authenticated users"
  ON public.payments FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Enable insert for authenticated users"
  ON public.payments FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Enable update for authenticated users"
  ON public.payments FOR UPDATE
  TO authenticated
  USING (true);

CREATE POLICY "Enable delete for authenticated users"
  ON public.payments FOR DELETE
  TO authenticated
  USING (true);

-- Create RLS policies for attendance
CREATE POLICY "Enable read access for all authenticated users"
  ON public.attendance FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Enable insert for authenticated users"
  ON public.attendance FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Enable update for authenticated users"
  ON public.attendance FOR UPDATE
  TO authenticated
  USING (true);

CREATE POLICY "Enable delete for authenticated users"
  ON public.attendance FOR DELETE
  TO authenticated
  USING (true);

-- Create RLS policies for users
CREATE POLICY "Enable read access for all authenticated users"
  ON public.users FOR SELECT
  TO authenticated
  USING (true);

-- Create storage bucket for receipts
INSERT INTO storage.buckets (id, name, public)
VALUES ('receipts', 'receipts', true)
ON CONFLICT (id) DO NOTHING;

-- Create storage policy for receipts
CREATE POLICY "Allow authenticated users to upload receipts"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'receipts');

CREATE POLICY "Allow public to read receipts"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'receipts');
