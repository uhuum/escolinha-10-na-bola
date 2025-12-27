-- ============================================
-- FIX ATTENDANCE RLS POLICIES
-- ============================================
-- This script ensures that both admin and coach users
-- can read and create attendance records
-- ============================================

-- Step 1: Enable RLS on attendance tables (if not already enabled)
ALTER TABLE attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance_records ENABLE ROW LEVEL SECURITY;

-- Step 2: Drop any existing policies that might be restrictive
DROP POLICY IF EXISTS "Enable read attendance" ON attendance;
DROP POLICY IF EXISTS "Enable insert attendance" ON attendance;
DROP POLICY IF EXISTS "Enable update attendance" ON attendance;
DROP POLICY IF EXISTS "Enable delete attendance" ON attendance;

DROP POLICY IF EXISTS "Enable read attendance_records" ON attendance_records;
DROP POLICY IF EXISTS "Enable insert attendance_records" ON attendance_records;
DROP POLICY IF EXISTS "Enable update attendance_records" ON attendance_records;
DROP POLICY IF EXISTS "Enable delete attendance_records" ON attendance_records;

-- Step 3: Create permissive policies for ATTENDANCE table
-- All authenticated users (admin and coach) can read ALL attendance records
CREATE POLICY "Enable read attendance" ON attendance
  FOR SELECT USING (true);

-- All authenticated users can insert attendance records
CREATE POLICY "Enable insert attendance" ON attendance
  FOR INSERT WITH CHECK (true);

-- All authenticated users can update attendance records
CREATE POLICY "Enable update attendance" ON attendance
  FOR UPDATE USING (true);

-- All authenticated users can delete attendance records
CREATE POLICY "Enable delete attendance" ON attendance
  FOR DELETE USING (true);

-- Step 4: Create permissive policies for ATTENDANCE_RECORDS table
-- All authenticated users (admin and coach) can read ALL attendance records
CREATE POLICY "Enable read attendance_records" ON attendance_records
  FOR SELECT USING (true);

-- All authenticated users can insert attendance records
CREATE POLICY "Enable insert attendance_records" ON attendance_records
  FOR INSERT WITH CHECK (true);

-- All authenticated users can update attendance records  
CREATE POLICY "Enable update attendance_records" ON attendance_records
  FOR UPDATE USING (true);

-- All authenticated users can delete attendance records
CREATE POLICY "Enable delete attendance_records" ON attendance_records
  FOR DELETE USING (true);

-- Step 5: Also ensure students table has proper RLS policies
ALTER TABLE students ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Enable read students" ON students;
DROP POLICY IF EXISTS "Enable insert students" ON students;
DROP POLICY IF EXISTS "Enable update students" ON students;
DROP POLICY IF EXISTS "Enable delete students" ON students;

CREATE POLICY "Enable read students" ON students
  FOR SELECT USING (true);

CREATE POLICY "Enable insert students" ON students
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Enable update students" ON students
  FOR UPDATE USING (true);

CREATE POLICY "Enable delete students" ON students
  FOR DELETE USING (true);

-- Step 6: Also ensure payments table has proper RLS policies
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Enable read payments" ON payments;
DROP POLICY IF EXISTS "Enable insert payments" ON payments;
DROP POLICY IF EXISTS "Enable update payments" ON payments;
DROP POLICY IF EXISTS "Enable delete payments" ON payments;

CREATE POLICY "Enable read payments" ON payments
  FOR SELECT USING (true);

CREATE POLICY "Enable insert payments" ON payments
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Enable update payments" ON payments
  FOR UPDATE USING (true);

CREATE POLICY "Enable delete payments" ON payments
  FOR DELETE USING (true);

-- Step 7: Verify the policies were created
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd
FROM pg_policies 
WHERE tablename IN ('attendance', 'attendance_records', 'students', 'payments')
ORDER BY tablename, policyname;
