-- Add is_scholarship field to students table
ALTER TABLE students ADD COLUMN IF NOT EXISTS is_scholarship BOOLEAN DEFAULT false;

-- Add charged_at field to payments table to track when payment was marked as charged
ALTER TABLE payments ADD COLUMN IF NOT EXISTS charged_at TIMESTAMP;
