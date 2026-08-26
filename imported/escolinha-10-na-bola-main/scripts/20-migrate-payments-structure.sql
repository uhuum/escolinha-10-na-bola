-- ============================================
-- MIGRAÇÃO DA TABELA PAYMENTS
-- Adiciona due_date, month_number, year_number
-- ============================================

-- 1. Adicionar novas colunas à tabela payments
ALTER TABLE payments 
ADD COLUMN IF NOT EXISTS due_date DATE,
ADD COLUMN IF NOT EXISTS month_number INTEGER,
ADD COLUMN IF NOT EXISTS year_number INTEGER;

-- 2. Criar função para converter mês em português para número
CREATE OR REPLACE FUNCTION get_month_number(month_name TEXT) 
RETURNS INTEGER AS $$
BEGIN
  RETURN CASE lower(trim(split_part(month_name, '/', 1)))
    WHEN 'janeiro' THEN 1
    WHEN 'fevereiro' THEN 2
    WHEN 'março' THEN 3
    WHEN 'marco' THEN 3
    WHEN 'abril' THEN 4
    WHEN 'maio' THEN 5
    WHEN 'junho' THEN 6
    WHEN 'julho' THEN 7
    WHEN 'agosto' THEN 8
    WHEN 'setembro' THEN 9
    WHEN 'outubro' THEN 10
    WHEN 'novembro' THEN 11
    WHEN 'dezembro' THEN 12
    ELSE NULL
  END;
END;
$$ LANGUAGE plpgsql;

-- 3. Criar função para extrair ano do campo month
CREATE OR REPLACE FUNCTION get_year_from_month(month_name TEXT) 
RETURNS INTEGER AS $$
DECLARE
  parts TEXT[];
BEGIN
  -- Se contém "/" (formato "Janeiro/2025")
  IF month_name LIKE '%/%' THEN
    parts := string_to_array(month_name, '/');
    RETURN NULLIF(trim(parts[2]), '')::INTEGER;
  ELSE
    -- Formato antigo sem ano, assume ano atual
    RETURN EXTRACT(YEAR FROM CURRENT_DATE)::INTEGER;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- 4. Migrar dados existentes
UPDATE payments
SET 
  month_number = get_month_number(month),
  year_number = get_year_from_month(month),
  due_date = make_date(
    get_year_from_month(month),
    get_month_number(month),
    10 -- Vencimento dia 10 de cada mês
  )
WHERE month_number IS NULL OR year_number IS NULL OR due_date IS NULL;

-- 5. Atualizar status baseado em receipt
UPDATE payments
SET status = 'Pago'
WHERE receipt IS NOT NULL 
  AND receipt != '' 
  AND status != 'Pago';

-- 6. Criar índices para performance
CREATE INDEX IF NOT EXISTS idx_payments_due_date ON payments(due_date);
CREATE INDEX IF NOT EXISTS idx_payments_year_month ON payments(year_number, month_number);
CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status);

-- 7. Criar constraint única para evitar duplicidade (apenas se não existir)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'unique_student_due_date'
  ) THEN
    ALTER TABLE payments
    ADD CONSTRAINT unique_student_due_date UNIQUE (student_id, due_date);
  END IF;
EXCEPTION
  WHEN duplicate_table THEN
    NULL;
END $$;
