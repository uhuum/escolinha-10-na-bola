-- Check all payments from January
SELECT 
  COUNT(*) as total_january_payments,
  COUNT(CASE WHEN status = 'Pagamento Baixado' THEN 1 END) as paid_january,
  COUNT(CASE WHEN status != 'Pagamento Baixado' THEN 1 END) as unpaid_january
FROM payments
WHERE month ILIKE 'Janeiro%' OR month_number = 1;

-- Show all January payments with details
SELECT 
  p.id,
  p.student_id,
  s.name as student_name,
  p.month,
  p.month_number,
  p.year_number,
  p.status,
  p.value,
  p.paid_at,
  p.created_at
FROM payments p
LEFT JOIN students s ON p.student_id = s.id
WHERE p.month ILIKE 'Janeiro%' OR p.month_number = 1
ORDER BY p.year_number DESC, s.name ASC;

-- Show count by month/year
SELECT 
  month,
  month_number,
  year_number,
  COUNT(*) as total_count,
  COUNT(CASE WHEN status = 'Pagamento Baixado' THEN 1 END) as paid_count
FROM payments
GROUP BY month, month_number, year_number
ORDER BY year_number DESC, month_number DESC;
