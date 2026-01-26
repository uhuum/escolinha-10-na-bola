-- Complete database reset and fix for users table
-- This script fixes all constraint and data issues

-- Step 1: Disable RLS temporarily to allow modifications
ALTER TABLE public.users DISABLE ROW LEVEL SECURITY;

-- Step 2: Drop the problematic constraint
ALTER TABLE public.users DROP CONSTRAINT IF EXISTS users_role_check;

-- Step 3: Clear all existing data (fresh start)
TRUNCATE TABLE public.users CASCADE;

-- Step 4: Create the correct constraint
ALTER TABLE public.users ADD CONSTRAINT users_role_check CHECK (role IN ('admin', 'coach'));

-- Step 5: Re-enable RLS
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Step 6: Create RLS policies for security
DROP POLICY IF EXISTS "Enable insert for public" ON public.users;
DROP POLICY IF EXISTS "Enable read access to users" ON public.users;
DROP POLICY IF EXISTS "Enable read access to users (public)" ON public.users;

CREATE POLICY "Enable insert for public" ON public.users
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Enable read access to users" ON public.users
  FOR SELECT
  USING (true);

-- Step 7: Insert users with correct bcrypt hashes
-- Password 'jp974832' hashed with bcrypt
INSERT INTO public.users (username, password_hash, role, name, created_at, updated_at)
VALUES (
  'admin',
  '$2a$06$9Itdbs2tq2jqCpc4Vtj3TuAmbige7mUUSVA20nkAMOgv5yxL/xtwe',
  'admin',
  'Administrador',
  NOW(),
  NOW()
);

-- Password 'treinar10' hashed with bcrypt
INSERT INTO public.users (username, password_hash, role, name, created_at, updated_at)
VALUES (
  'treinadores',
  '$2b$10$HqAKW9HpKGj9qPLtBbmzqOxP2s7n9kPpC7vWFNDBQfbSaAGR4uY6q',
  'coach',
  'Treinador Principal',
  NOW(),
  NOW()
);

-- Step 8: Verify everything is correct
SELECT id, username, role, name FROM public.users ORDER BY created_at;
