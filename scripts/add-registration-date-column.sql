-- Add registration_date column to students table if it doesn't exist
ALTER TABLE students ADD COLUMN IF NOT EXISTS registration_date TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Add payment_type column to payments table if it doesn't exist
ALTER TABLE payments ADD COLUMN IF NOT EXISTS payment_type TEXT;
