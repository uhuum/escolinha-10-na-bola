-- Check Row Level Security policies on payments table
-- This script will help debug if RLS is blocking payment data

-- Check if there are any records in payments
SELECT COUNT(*) as total_payments FROM payments;

-- Show sample payments with all columns
SELECT *
FROM payments 
LIMIT 10;

-- Check if payments have null student_id (potential issue)
SELECT COUNT(*) as null_student_ids 
FROM payments 
WHERE student_id IS NULL;

-- Check students count
SELECT COUNT(*) as total_students FROM students;

-- Check payment status distribution
SELECT status, COUNT(*) as count 
FROM payments 
GROUP BY status;

-- Check if there are any recent payments
SELECT COUNT(*) as payments_last_30_days
FROM payments
WHERE created_at >= NOW() - INTERVAL '30 days';

-- Show monthly breakdown
SELECT month, COUNT(*) as payment_count
FROM payments
GROUP BY month
ORDER BY month DESC
LIMIT 12;
