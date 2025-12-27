-- Drop the restrictive RLS policy
DROP POLICY IF EXISTS "Enable read access to users" ON public.users;

-- Delete existing users to start fresh
DELETE FROM public.users;

-- Create a new policy that allows the service role to read users
-- The service role bypasses RLS anyway, but this is for consistency
CREATE POLICY "Enable read access to users (public)" ON public.users
  FOR SELECT
  USING (true);

-- Insert admin user with hashed password (bcrypt hash of 'jp974832')
INSERT INTO public.users (username, password_hash, role, name, created_at, updated_at)
VALUES (
  'admin',
  '$2a$10$r9h.cIPz0gi.URNNX3kh2OPST9/PgBkqquzi.Ss7KIUgO2t0jKMm6',
  'admin',
  'Administrador',
  NOW(),
  NOW()
);

-- Insert coach user with hashed password (bcrypt hash of 'treinar10')
INSERT INTO public.users (username, password_hash, role, name, created_at, updated_at)
VALUES (
  'treinadores',
  '$2a$10$FYZFTqSvzMqL8.8/8vXNKOqPn/1rJH5QW5vZqKL6pDxK9H6J0Sv8q',
  'coach',
  'Treinador Principal',
  NOW(),
  NOW()
);

-- Verify inserts
SELECT id, username, role, name FROM public.users;
