-- Check total students and their payment records
SELECT 
  COUNT(DISTINCT s.id) as total_students,
  COUNT(DISTINCT p.id) as total_payments,
  COUNT(DISTINCT s.id) FILTER (WHERE s.is_active = true) as active_students,
  COUNT(DISTINCT s.id) FILTER (WHERE s.is_active = false) as inactive_students
FROM students s
LEFT JOIN payments p ON s.id = p.student_id;

-- List all students with their payment counts
SELECT 
  s.id,
  s.name,
  s.is_active,
  COUNT(p.id) as payment_count,
  MIN(p.month) as first_payment_month,
  MAX(p.month) as last_payment_month
FROM students s
LEFT JOIN payments p ON s.id = p.student_id
GROUP BY s.id, s.name, s.is_active
ORDER BY s.name;

-- Check payment distribution by month
SELECT 
  p.month,
  p.month_number,
  p.year_number,
  COUNT(*) as total_payments
FROM payments p
GROUP BY p.month, p.month_number, p.year_number
ORDER BY p.year_number DESC, p.month_number DESC;
