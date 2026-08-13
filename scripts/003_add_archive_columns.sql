-- Adiciona colunas para arquivamento de alunos
ALTER TABLE students 
ADD COLUMN IF NOT EXISTS archived_at TIMESTAMPTZ DEFAULT NULL,
ADD COLUMN IF NOT EXISTS archive_reason TEXT DEFAULT NULL;

-- Índice para filtrar alunos arquivados
CREATE INDEX IF NOT EXISTS idx_students_archived ON students(archived_at) WHERE archived_at IS NOT NULL;
