-- Check all students and their registration dates
SELECT 
  id,
  name,
  registrationDate,
  EXTRACT(YEAR FROM registrationDate)::INTEGER as reg_year,
  EXTRACT(MONTH FROM registrationDate)::INTEGER as reg_month,
  isActive,
  archivedAt,
  monthlyValue
FROM students
ORDER BY name;
