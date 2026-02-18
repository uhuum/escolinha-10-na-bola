-- ====================================================
-- REMOVE SCHEDULE_CONFIGS COLUMN IF IT EXISTS
-- ====================================================
-- This script will safely remove the schedule_configs column
-- if it exists in the students table

-- Check if column exists and drop it
DO $$ 
BEGIN
    IF EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'students' 
        AND column_name = 'schedule_configs'
    ) THEN
        ALTER TABLE students DROP COLUMN schedule_configs;
        RAISE NOTICE 'Column schedule_configs dropped successfully';
    ELSE
        RAISE NOTICE 'Column schedule_configs does not exist';
    END IF;
END $$;

-- Verify the students table structure
SELECT 
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns
WHERE table_name = 'students'
ORDER BY ordinal_position;
