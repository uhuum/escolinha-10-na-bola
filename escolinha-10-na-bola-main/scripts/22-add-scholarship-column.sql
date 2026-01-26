-- ============================================
-- ADICIONAR COLUNA is_scholarship SE NÃO EXISTIR
-- ============================================

ALTER TABLE students 
ADD COLUMN IF NOT EXISTS is_scholarship BOOLEAN DEFAULT FALSE;

-- Atualizar alunos que são bolsistas (mensalidade = 0)
UPDATE students
SET is_scholarship = TRUE
WHERE monthly_value = 0;
