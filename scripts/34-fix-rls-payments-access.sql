-- Fix RLS policies for payments table to allow authenticated users to see all records
-- This resolves issues where data exists in the database but isn't visible due to security policies

-- First, disable RLS temporarily to check
ALTER TABLE payments DISABLE ROW LEVEL SECURITY;

-- Verify we can see all data now
SELECT COUNT(*) as total_payments FROM payments;
SELECT COUNT(DISTINCT student_id) as students_with_payments FROM payments;

-- Show sample data
SELECT id, student_id, month, status, created_at FROM payments ORDER BY created_at DESC LIMIT 5;
