-- Add trainer_id column to attendance table for permission control
ALTER TABLE attendance ADD COLUMN IF NOT EXISTS trainer_id TEXT;

-- Update existing records to have a default trainer_id based on trainer_name
-- This is a one-time migration for existing data
UPDATE attendance SET trainer_id = 'unknown' WHERE trainer_id IS NULL;

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_attendance_trainer_id ON attendance(trainer_id);
