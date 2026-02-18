-- Ensure trainer_id column exists in attendance table
-- This script is idempotent and safe to run multiple times

-- Add trainer_id column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'attendance' AND column_name = 'trainer_id'
    ) THEN
        ALTER TABLE attendance ADD COLUMN trainer_id TEXT;
    END IF;
END $$;

-- Update existing records to have a default trainer_id
UPDATE attendance SET trainer_id = 'unknown' WHERE trainer_id IS NULL;

-- Create index for faster queries if it doesn't exist
CREATE INDEX IF NOT EXISTS idx_attendance_trainer_id ON attendance(trainer_id);

-- Refresh the schema cache by touching the table
COMMENT ON COLUMN attendance.trainer_id IS 'ID of the trainer who created this attendance record';
