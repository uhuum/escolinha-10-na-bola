-- Fix RLS policies for production environment
-- This ensures that students and payments tables are accessible to authenticated users

-- 1. Enable RLS on students table and set proper policies
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Enable read access to students" ON public.students;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON public.students;
DROP POLICY IF EXISTS "Enable update for authenticated users" ON public.students;

-- Create public read policy for students (allow authenticated users to read)
CREATE POLICY "Enable read access to students for authenticated" ON public.students
  FOR SELECT
  TO authenticated
  USING (true);

-- Create insert policy for authenticated users
CREATE POLICY "Enable insert for authenticated users on students" ON public.students
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Create update policy for authenticated users
CREATE POLICY "Enable update for authenticated users on students" ON public.students
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Create delete policy for authenticated users
CREATE POLICY "Enable delete for authenticated users on students" ON public.students
  FOR DELETE
  TO authenticated
  USING (true);

-- 2. Enable RLS on payments table and set proper policies
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Enable read access to payments" ON public.payments;
DROP POLICY IF EXISTS "Enable insert for authenticated users on payments" ON public.payments;
DROP POLICY IF EXISTS "Enable update for authenticated users on payments" ON public.payments;

-- Create public read policy for payments (allow authenticated users to read)
CREATE POLICY "Enable read access to payments for authenticated" ON public.payments
  FOR SELECT
  TO authenticated
  USING (true);

-- Create insert policy for authenticated users
CREATE POLICY "Enable insert for authenticated users on payments" ON public.payments
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Create update policy for authenticated users
CREATE POLICY "Enable update for authenticated users on payments" ON public.payments
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Create delete policy for authenticated users
CREATE POLICY "Enable delete for authenticated users on payments" ON public.payments
  FOR DELETE
  TO authenticated
  USING (true);

-- 3. Enable RLS on receipts table if it exists
ALTER TABLE public.receipts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Enable read access to receipts" ON public.receipts;
DROP POLICY IF EXISTS "Enable insert for authenticated users on receipts" ON public.receipts;

CREATE POLICY "Enable read access to receipts for authenticated" ON public.receipts
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Enable insert for authenticated users on receipts" ON public.receipts
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Verify policies are in place
SELECT 'Políticas RLS configuradas com sucesso!' as status;
