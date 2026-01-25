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

-- Drop payments_summary view if it exists - we use the main payments table directly
DROP VIEW IF EXISTS payments_summary CASCADE;
