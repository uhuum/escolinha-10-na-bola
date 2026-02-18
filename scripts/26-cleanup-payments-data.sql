-- Cleanup and ensure payments table data consistency
-- This script handles existing records to ensure stability

-- Add missing columns if not present
ALTER TABLE payments
ADD COLUMN IF NOT EXISTS month_number INTEGER,
ADD COLUMN IF NOT EXISTS year_number INTEGER,
ADD COLUMN IF NOT EXISTS charged_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS payment_type VARCHAR(50),
ADD COLUMN IF NOT EXISTS is_scholarship BOOLEAN DEFAULT FALSE;

-- Populate month_number and year_number from month string if they're null
-- Months are stored as "Janeiro/2024", "Fevereiro/2024", etc.
-- First, safely extract year_number
UPDATE payments
SET
  year_number = CASE 
    WHEN month ~ '^\d+$' THEN CAST(month AS INTEGER)
    WHEN month ~ '/' THEN CAST(TRIM(SUBSTRING(month FROM POSITION('/' IN month) + 1)) AS INTEGER)
    ELSE EXTRACT(YEAR FROM NOW())::INTEGER
  END
WHERE (month_number IS NULL OR year_number IS NULL) AND month IS NOT NULL;

-- Then populate month_number based on the month name
UPDATE payments
SET
  month_number = CASE 
    WHEN month ILIKE 'Janeiro%' THEN 1
    WHEN month ILIKE 'Fevereiro%' THEN 2
    WHEN month ILIKE 'Março%' THEN 3
    WHEN month ILIKE 'Abril%' THEN 4
    WHEN month ILIKE 'Maio%' THEN 5
    WHEN month ILIKE 'Junho%' THEN 6
    WHEN month ILIKE 'Julho%' THEN 7
    WHEN month ILIKE 'Agosto%' THEN 8
    WHEN month ILIKE 'Setembro%' THEN 9
    WHEN month ILIKE 'Outubro%' THEN 10
    WHEN month ILIKE 'Novembro%' THEN 11
    WHEN month ILIKE 'Dezembro%' THEN 12
    ELSE NULL
  END
WHERE month_number IS NULL AND month IS NOT NULL;

-- Ensure due_date is set for all records
UPDATE payments
SET due_date = MAKE_DATE(COALESCE(year_number, EXTRACT(YEAR FROM NOW())::INTEGER), 
                         COALESCE(month_number, 1), 1) + INTERVAL '10 days'
WHERE due_date IS NULL;

-- Ensure created_at and updated_at are not null
UPDATE payments
SET created_at = NOW()
WHERE created_at IS NULL;

UPDATE payments
SET updated_at = NOW()
WHERE updated_at IS NULL;

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_payments_student_id ON payments(student_id);
CREATE INDEX IF NOT EXISTS idx_payments_month ON payments(month);
CREATE INDEX IF NOT EXISTS idx_payments_due_date ON payments(due_date);
CREATE INDEX IF NOT EXISTS idx_payments_student_month ON payments(student_id, month);
CREATE INDEX IF NOT EXISTS idx_payments_month_number_year ON payments(month_number, year_number);

-- Set missing status values
UPDATE payments
SET status = 'Em Aberto'
WHERE status IS NULL AND (is_scholarship = FALSE OR is_scholarship IS NULL);

-- Log completion
SELECT COUNT(*) as total_payments, 
       COUNT(CASE WHEN due_date IS NOT NULL THEN 1 END) as with_due_date,
       COUNT(CASE WHEN status IS NOT NULL THEN 1 END) as with_status
FROM payments;
