-- Fix payments table schema to match application requirements
-- Add missing columns if they don't exist

-- Check and add due_date column
ALTER TABLE payments
ADD COLUMN IF NOT EXISTS due_date DATE;

-- Ensure all expected columns exist
ALTER TABLE payments
ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_payments_student_month ON payments(student_id, month);
CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status);

-- Update view for backward compatibility
DROP VIEW IF EXISTS payments_summary CASCADE;
CREATE VIEW payments_summary AS
SELECT
  p.id,
  p.student_id,
  s.name as student_name,
  p.month,
  p.status,
  p.value,
  p.due_date,
  p.postponed_to,
  p.paid_at,
  p.receipt,
  p.created_at,
  p.updated_at
FROM payments p
LEFT JOIN students s ON p.student_id = s.id;

-- Grant permissions
GRANT SELECT ON payments_summary TO anon, authenticated;
