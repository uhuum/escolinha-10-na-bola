-- Generate missing payment records for all months from January 2026 to December 2026
-- This ensures all students have payment records for the entire year

-- First, let's get all unique students
WITH all_students AS (
  SELECT DISTINCT id, name 
  FROM students 
  WHERE is_active = TRUE OR is_active IS NULL
),
-- Generate all months for 2026
all_months_2026 AS (
  SELECT 
    1 as month_number,
    'Janeiro' as month_name,
    2026 as year_number
  UNION ALL SELECT 2, 'Fevereiro', 2026
  UNION ALL SELECT 3, 'Março', 2026
  UNION ALL SELECT 4, 'Abril', 2026
  UNION ALL SELECT 5, 'Maio', 2026
  UNION ALL SELECT 6, 'Junho', 2026
  UNION ALL SELECT 7, 'Julho', 2026
  UNION ALL SELECT 8, 'Agosto', 2026
  UNION ALL SELECT 9, 'Setembro', 2026
  UNION ALL SELECT 10, 'Outubro', 2026
  UNION ALL SELECT 11, 'Novembro', 2026
  UNION ALL SELECT 12, 'Dezembro', 2026
),
-- Find missing payments
missing_payments AS (
  SELECT 
    s.id as student_id,
    m.month_number,
    m.year_number,
    CONCAT(m.month_name, '/', m.year_number) as month
  FROM all_students s
  CROSS JOIN all_months_2026 m
  WHERE NOT EXISTS (
    SELECT 1 FROM payments p 
    WHERE p.student_id = s.id 
    AND p.month_number = m.month_number 
    AND p.year_number = m.year_number
  )
)
-- Insert missing payments without is_scholarship column
INSERT INTO payments (
  student_id,
  month,
  month_number,
  year_number,
  status,
  value,
  due_date,
  created_at,
  updated_at
)
SELECT 
  student_id,
  month,
  month_number,
  year_number,
  'Em Aberto' as status,
  180 as value,
  MAKE_DATE(year_number, month_number, 1) + INTERVAL '10 days' as due_date,
  NOW() as created_at,
  NOW() as updated_at
FROM missing_payments
ON CONFLICT DO NOTHING;

-- Verify the results
SELECT 
  month,
  COUNT(DISTINCT student_id) as students_count
FROM payments
WHERE year_number = 2026
GROUP BY month
ORDER BY month;
