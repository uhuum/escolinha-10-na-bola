-- Fix the users_role_check constraint to accept correct values
-- This script drops and recreates the constraint with the correct values

-- First, disable RLS temporarily to allow modifications
ALTER TABLE public.users DISABLE ROW LEVEL SECURITY;

-- Drop the existing constraint if it exists
ALTER TABLE public.users DROP CONSTRAINT IF EXISTS users_role_check;

-- Add the correct constraint
ALTER TABLE public.users ADD CONSTRAINT users_role_check CHECK (role IN ('admin', 'coach'));

-- Re-enable RLS
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Verify the constraint is correct
SELECT constraint_name, constraint_type
FROM information_schema.table_constraints
WHERE table_name = 'users' AND constraint_type = 'CHECK';

-- Show current users to verify they have valid roles
SELECT id, username, role FROM public.users;
