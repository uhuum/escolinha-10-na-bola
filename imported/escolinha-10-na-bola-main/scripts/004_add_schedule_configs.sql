-- Add schedule_configs column to students table for storing day-schedule configurations
ALTER TABLE students ADD COLUMN IF NOT EXISTS schedule_configs JSONB;
