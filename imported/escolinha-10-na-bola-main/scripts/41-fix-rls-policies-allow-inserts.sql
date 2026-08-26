-- Script para corrigir as políticas RLS e permitir inserções
-- Execute este script no SQL Editor do Supabase

-- 1. Remover políticas existentes da tabela students
DROP POLICY IF EXISTS "Allow all operations for authenticated users" ON students;
DROP POLICY IF EXISTS "Allow public read access" ON students;
DROP POLICY IF EXISTS "Enable all operations for authenticated users" ON students;
DROP POLICY IF EXISTS "Enable read access for all users" ON students;
DROP POLICY IF EXISTS "Students are viewable by everyone" ON students;
DROP POLICY IF EXISTS "Students are editable by authenticated users" ON students;

-- 2. Desabilitar RLS temporariamente para criar novas políticas
ALTER TABLE students DISABLE ROW LEVEL SECURITY;

-- 3. Habilitar RLS novamente
ALTER TABLE students ENABLE ROW LEVEL SECURITY;

-- 4. Criar políticas permissivas para todas as operações
-- Política de SELECT (leitura) - permite para todos
CREATE POLICY "Allow public read access to students"
ON students FOR SELECT
TO public
USING (true);

-- Política de INSERT (inserção) - permite para todos autenticados e anônimos
CREATE POLICY "Allow insert for all users"
ON students FOR INSERT
TO public
WITH CHECK (true);

-- Política de UPDATE (atualização) - permite para todos autenticados
CREATE POLICY "Allow update for all users"
ON students FOR UPDATE
TO public
USING (true)
WITH CHECK (true);

-- Política de DELETE (exclusão) - permite para todos autenticados
CREATE POLICY "Allow delete for all users"
ON students FOR DELETE
TO public
USING (true);

-- 5. Aplicar as mesmas políticas para a tabela payments
DROP POLICY IF EXISTS "Allow all operations for payments" ON payments;
DROP POLICY IF EXISTS "Enable all operations for authenticated users" ON payments;

ALTER TABLE payments DISABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read access to payments"
ON payments FOR SELECT
TO public
USING (true);

CREATE POLICY "Allow insert for all users on payments"
ON payments FOR INSERT
TO public
WITH CHECK (true);

CREATE POLICY "Allow update for all users on payments"
ON payments FOR UPDATE
TO public
USING (true)
WITH CHECK (true);

CREATE POLICY "Allow delete for all users on payments"
ON payments FOR DELETE
TO public
USING (true);

-- 6. Aplicar as mesmas políticas para a tabela attendance
DROP POLICY IF EXISTS "Allow all operations for attendance" ON attendance;
DROP POLICY IF EXISTS "Enable all operations for authenticated users" ON attendance;

ALTER TABLE attendance DISABLE ROW LEVEL SECURITY;
ALTER TABLE attendance ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read access to attendance"
ON attendance FOR SELECT
TO public
USING (true);

CREATE POLICY "Allow insert for all users on attendance"
ON attendance FOR INSERT
TO public
WITH CHECK (true);

CREATE POLICY "Allow update for all users on attendance"
ON attendance FOR UPDATE
TO public
USING (true)
WITH CHECK (true);

CREATE POLICY "Allow delete for all users on attendance"
ON attendance FOR DELETE
TO public
USING (true);

-- 7. Verificar as políticas criadas
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies
WHERE tablename IN ('students', 'payments', 'attendance')
ORDER BY tablename, policyname;
