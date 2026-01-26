-- Final verification that payment data is complete and accessible
-- This script verifies the payments are ready for production use

-- Check total counts
SELECT 
  'Total Students' as metric,
  COUNT(*) as value
FROM students
UNION ALL
SELECT 
  'Total Payments' as metric,
  COUNT(*) as value
FROM payments
UNION ALL
SELECT 
  'Payments with monthNumber' as metric,
  COUNT(*) as value
FROM payments
WHERE month_number IS NOT NULL
UNION ALL
SELECT 
  'Payments with yearNumber' as metric,
  COUNT(*) as value
FROM payments
WHERE year_number IS NOT NULL
UNION ALL
SELECT 
  'Payments with due_date' as metric,
  COUNT(*) as value
FROM payments
WHERE due_date IS NOT NULL;

-- Show sample payments with student names to verify data integrity
SELECT 
  s.name as student_name,
  p.month,
  p.month_number,
  p.year_number,
  p.status,
  p.value,
  p.due_date
FROM payments p
LEFT JOIN students s ON p.student_id = s.id
ORDER BY s.name, p.year_number DESC, p.month_number DESC
LIMIT 20;

-- Verify payments table structure
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'payments'
ORDER BY ordinal_position;
