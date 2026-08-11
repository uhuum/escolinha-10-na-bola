-- Add thumbnail_url column for lightweight listing images
ALTER TABLE students ADD COLUMN IF NOT EXISTS thumbnail_url TEXT;

-- Add schedule_configs column for per-day schedule configurations
ALTER TABLE students ADD COLUMN IF NOT EXISTS schedule_configs JSONB;

-- Index to speed up the ordering query used in listings
CREATE INDEX IF NOT EXISTS idx_students_name ON students (name);
CREATE INDEX IF NOT EXISTS idx_payments_student_id ON payments (student_id);
CREATE INDEX IF NOT EXISTS idx_payments_due_date ON payments (due_date);
