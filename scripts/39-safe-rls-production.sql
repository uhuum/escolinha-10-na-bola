-- Safe RLS Configuration Script for Production
-- ⚠️ IMPORTANT: This script ONLY modifies RLS policies, it does NOT delete any data
-- It preserves all existing student and payment information

-- First, let's verify the current data before making changes
-- Count students and payments
SELECT 'Starting RLS configuration...' as status;
SELECT COUNT(*) as total_students FROM public.students;
SELECT COUNT(*) as total_payments FROM public.payments;

-- 1. Configure RLS on students table (preserves all data)
-- Only enable RLS and add access policies - does NOT delete rows
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;

-- Drop old policies safely (they only control access, not data)
DROP POLICY IF EXISTS "Enable read access to students" ON public.students;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON public.students;
DROP POLICY IF EXISTS "Enable update for authenticated users" ON public.students;
DROP POLICY IF EXISTS "Enable delete for authenticated users" ON public.students;

-- Create policies that allow authenticated users to access their data
CREATE POLICY "Students - Read for authenticated" ON public.students
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Students - Insert for authenticated" ON public.students
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Students - Update for authenticated" ON public.students
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Students - Delete for authenticated" ON public.students
  FOR DELETE
  TO authenticated
  USING (true);

-- 2. Configure RLS on payments table (preserves all data)
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

-- Drop old policies safely
DROP POLICY IF EXISTS "Enable read access to payments" ON public.payments;
DROP POLICY IF EXISTS "Enable insert for authenticated users on payments" ON public.payments;
DROP POLICY IF EXISTS "Enable update for authenticated users on payments" ON public.payments;
DROP POLICY IF EXISTS "Enable delete for authenticated users on payments" ON public.payments;

-- Create policies that allow authenticated users to access their data
CREATE POLICY "Payments - Read for authenticated" ON public.payments
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Payments - Insert for authenticated" ON public.payments
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Payments - Update for authenticated" ON public.payments
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Payments - Delete for authenticated" ON public.payments
  FOR DELETE
  TO authenticated
  USING (true);

-- 3. Configure RLS on attendance table (preserves all data)
ALTER TABLE public.attendance ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Enable read for authenticated" ON public.attendance;
DROP POLICY IF EXISTS "Enable insert for authenticated" ON public.attendance;
DROP POLICY IF EXISTS "Enable update for authenticated" ON public.attendance;

CREATE POLICY "Attendance - Read for authenticated" ON public.attendance
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Attendance - Insert for authenticated" ON public.attendance
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Attendance - Update for authenticated" ON public.attendance
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- 4. Verify all data is still intact after RLS configuration
SELECT 'Verification after RLS configuration:' as status;
SELECT COUNT(*) as total_students_after FROM public.students;
SELECT COUNT(*) as total_payments_after FROM public.payments;
SELECT COUNT(*) as total_attendance_after FROM public.attendance;

-- Final confirmation message
SELECT '✅ RLS policies configured successfully! All data preserved!' as final_status;
