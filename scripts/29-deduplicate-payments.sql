-- Deduplicate and consolidate payment records
-- Keep only the best record for each student/month/year combination

-- First, identify duplicate records (same student, month_number, year_number)
WITH duplicates AS (
  SELECT 
    id,
    student_id,
    month_number,
    year_number,
    ROW_NUMBER() OVER (PARTITION BY student_id, month_number, year_number ORDER BY created_at DESC) as rn,
    COUNT(*) OVER (PARTITION BY student_id, month_number, year_number) as dup_count
  FROM payments
  WHERE month_number IS NOT NULL AND year_number IS NOT NULL
)
-- Delete older duplicate records, keeping the most recent one
DELETE FROM payments
WHERE id IN (
  SELECT id FROM duplicates WHERE rn > 1 AND dup_count > 1
);

-- Update month field to be consistent (with year) for all remaining records
UPDATE payments
SET month = CASE 
  WHEN month_number = 1 THEN 'Janeiro/' || year_number
  WHEN month_number = 2 THEN 'Fevereiro/' || year_number
  WHEN month_number = 3 THEN 'Março/' || year_number
  WHEN month_number = 4 THEN 'Abril/' || year_number
  WHEN month_number = 5 THEN 'Maio/' || year_number
  WHEN month_number = 6 THEN 'Junho/' || year_number
  WHEN month_number = 7 THEN 'Julho/' || year_number
  WHEN month_number = 8 THEN 'Agosto/' || year_number
  WHEN month_number = 9 THEN 'Setembro/' || year_number
  WHEN month_number = 10 THEN 'Outubro/' || year_number
  WHEN month_number = 11 THEN 'Novembro/' || year_number
  WHEN month_number = 12 THEN 'Dezembro/' || year_number
  ELSE month
END
WHERE month_number IS NOT NULL AND year_number IS NOT NULL;

-- Verify the cleanup
SELECT 
  'Total payments after cleanup' as metric,
  COUNT(*) as value
FROM payments
UNION ALL
SELECT 
  'Unique student/month/year combinations',
  COUNT(DISTINCT CONCAT(student_id, '-', month_number, '-', year_number))
FROM payments
UNION ALL
SELECT 
  'Payments with status',
  COUNT(DISTINCT CASE WHEN status IS NOT NULL THEN id END)
FROM payments;

-- Show sample of final data
SELECT 
  student_id,
  month,
  month_number,
  year_number,
  status,
  value,
  due_date
FROM payments
ORDER BY year_number DESC, month_number DESC
LIMIT 15;
