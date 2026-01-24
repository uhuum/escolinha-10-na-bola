-- =====================================================
-- EXECUTE ESTE SCRIPT NO SQL EDITOR DO SUPABASE
-- =====================================================
-- Este script adiciona a coluna 'registration_date' na tabela students
-- SEM EXCLUIR NENHUM DADO EXISTENTE
-- =====================================================

-- Adiciona a coluna registration_date se ela não existir
ALTER TABLE students 
ADD COLUMN IF NOT EXISTS registration_date TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Atualiza os registros existentes que não têm registration_date
-- Define como a data de criação (created_at) ou data atual
UPDATE students 
SET registration_date = COALESCE(created_at, NOW())
WHERE registration_date IS NULL;

-- Verificação: conte quantos alunos existem
SELECT COUNT(*) as total_students FROM students;

-- Verificação: veja os primeiros 5 alunos com a nova coluna
SELECT id, name, registration_date, created_at 
FROM students 
ORDER BY name 
LIMIT 5;
