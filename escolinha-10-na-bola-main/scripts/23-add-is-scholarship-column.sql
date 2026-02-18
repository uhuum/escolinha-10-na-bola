-- Adicionar coluna is_scholarship à tabela students se não existir
ALTER TABLE students 
ADD COLUMN IF NOT EXISTS is_scholarship BOOLEAN DEFAULT false;

-- Atualizar o índice de students
CREATE INDEX IF NOT EXISTS idx_students_active ON students(is_active);
