-- =========================================================
-- SCRIPT DEFINITIVO DE ORGANIZAÇÃO FINANCEIRA
-- ESCOLINHA 10 NA BOLA
-- Dezembro/2025 até Dezembro/2026
-- =========================================================

BEGIN;

-- =========================================================
-- 1. GARANTIR COLUNAS
-- =========================================================
ALTER TABLE payments ADD COLUMN IF NOT EXISTS due_date DATE;
ALTER TABLE payments ADD COLUMN IF NOT EXISTS month_number INT;
ALTER TABLE payments ADD COLUMN IF NOT EXISTS year_number INT;

-- =========================================================
-- 2. CORRIGIR PAGOS POR RECIBO
-- =========================================================
UPDATE payments
SET 
  status = 'Pago',
  paid_at = COALESCE(paid_at::timestamp, updated_at, created_at),
  updated_at = NOW()
WHERE receipt IS NOT NULL
  AND receipt <> ''
  AND status <> 'Pago';

-- =========================================================
-- 3. CONVERTER DADOS ANTIGOS
-- =========================================================
UPDATE payments
SET
  month_number = CASE
    WHEN month ILIKE '%janeiro%' THEN 1
    WHEN month ILIKE '%fevereiro%' THEN 2
    WHEN month ILIKE '%março%' OR month ILIKE '%marco%' THEN 3
    WHEN month ILIKE '%abril%' THEN 4
    WHEN month ILIKE '%maio%' THEN 5
    WHEN month ILIKE '%junho%' THEN 6
    WHEN month ILIKE '%julho%' THEN 7
    WHEN month ILIKE '%agosto%' THEN 8
    WHEN month ILIKE '%setembro%' THEN 9
    WHEN month ILIKE '%outubro%' THEN 10
    WHEN month ILIKE '%novembro%' THEN 11
    WHEN month ILIKE '%dezembro%' THEN 12
  END,
  year_number = NULLIF(regexp_replace(month, '[^0-9]', '', 'g'), '')::INT
WHERE month IS NOT NULL;

UPDATE payments
SET due_date = make_date(year_number, month_number, 10)
WHERE due_date IS NULL
  AND year_number IS NOT NULL
  AND month_number IS NOT NULL;

-- =========================================================
-- 4. CONSTRAINT ANTI-DUPLICAÇÃO
-- =========================================================
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'unique_student_due'
  ) THEN
    ALTER TABLE payments
    ADD CONSTRAINT unique_student_due UNIQUE (student_id, due_date);
  END IF;
END $$;

-- =========================================================
-- 5. ÍNDICES
-- =========================================================
CREATE INDEX IF NOT EXISTS idx_payments_student_id ON payments(student_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status);
CREATE INDEX IF NOT EXISTS idx_payments_due_date ON payments(due_date);
CREATE INDEX IF NOT EXISTS idx_payments_year_month ON payments(year_number, month_number);

-- =========================================================
-- 6. REMOVER FUNÇÕES ANTIGAS
-- =========================================================
DROP FUNCTION IF EXISTS generate_student_payments(UUID, INTEGER, BOOLEAN);
DROP FUNCTION IF EXISTS generate_student_payments(TEXT, INTEGER, BOOLEAN);
DROP FUNCTION IF EXISTS generate_student_payments;

-- =========================================================
-- 7. CRIAR FUNÇÃO OFICIAL (UUID)
-- =========================================================
CREATE FUNCTION generate_student_payments(
  p_student_id UUID,
  p_monthly_value INTEGER,
  p_is_scholarship BOOLEAN DEFAULT FALSE
) RETURNS VOID AS $$
DECLARE
  v_year INTEGER;
  v_month INTEGER;
  v_due_date DATE;
  v_status TEXT;
  v_month_names TEXT[] := ARRAY[
    'Janeiro','Fevereiro','Março','Abril','Maio','Junho',
    'Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'
  ];
BEGIN
  FOR v_year IN 2025..2026 LOOP
    FOR v_month IN 1..12 LOOP

      IF v_year = 2025 AND v_month < 12 THEN CONTINUE; END IF;

      v_due_date := make_date(v_year, v_month, 10);

      IF p_is_scholarship OR p_monthly_value = 0 THEN
        v_status := 'Bolsista';
      ELSIF v_due_date < CURRENT_DATE THEN
        v_status := 'Não Pagou';
      ELSE
        v_status := 'Em Aberto';
      END IF;

      INSERT INTO payments (
        student_id,
        month,
        status,
        value,
        due_date,
        month_number,
        year_number,
        created_at,
        updated_at
      )
      VALUES (
        p_student_id,
        v_month_names[v_month] || '/' || v_year,
        v_status,
        CASE WHEN p_is_scholarship THEN 0 ELSE p_monthly_value END,
        v_due_date,
        v_month,
        v_year,
        NOW(),
        NOW()
      )
      ON CONFLICT (student_id, due_date) DO NOTHING;

    END LOOP;
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- =========================================================
-- 8. GERAR MENSALIDADES
-- =========================================================
DO $$
DECLARE r RECORD;
BEGIN
  FOR r IN 
    SELECT id, monthly_value, COALESCE(is_scholarship, FALSE) AS is_scholarship
    FROM students 
    WHERE is_active = TRUE
  LOOP
    PERFORM generate_student_payments(r.id, r.monthly_value, r.is_scholarship);
  END LOOP;
END $$;

COMMIT;

-- =========================================================
-- 9. RESUMO FINAL
-- =========================================================
SELECT 
  year_number,
  month_number,
  COUNT(*) AS total_pagamentos
FROM payments
WHERE due_date BETWEEN '2025-12-01' AND '2026-12-31'
GROUP BY year_number, month_number
ORDER BY year_number, month_number;

SELECT 'MIGRAÇÃO FINALIZADA COM SUCESSO' AS status;
