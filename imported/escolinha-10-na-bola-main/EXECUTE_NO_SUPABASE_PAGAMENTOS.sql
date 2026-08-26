-- Script SEGURO para corrigir a tabela de pagamentos
-- Este script NAO APAGA DADOS, apenas adiciona colunas faltantes

-- 1. Adicionar colunas que estao faltando na tabela payments
ALTER TABLE payments 
  ADD COLUMN IF NOT EXISTS due_date DATE,
  ADD COLUMN IF NOT EXISTS month_number INTEGER,
  ADD COLUMN IF NOT EXISTS year_number INTEGER,
  ADD COLUMN IF NOT EXISTS registration_date TIMESTAMP;

-- 2. Adicionar coluna registration_date na tabela students se não existir
ALTER TABLE students
  ADD COLUMN IF NOT EXISTS registration_date TIMESTAMP DEFAULT NOW(),
  ADD COLUMN IF NOT EXISTS is_scholarship BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS schedule_configs JSONB,
  ADD COLUMN IF NOT EXISTS archived_at TIMESTAMP,
  ADD COLUMN IF NOT EXISTS archive_reason TEXT;

-- 3. Preencher os dados para registros existentes
UPDATE payments
SET 
  month_number = CASE 
    WHEN month LIKE 'Janeiro%' THEN 1
    WHEN month LIKE 'Fevereiro%' THEN 2
    WHEN month LIKE 'Março%' THEN 3
    WHEN month LIKE 'Abril%' THEN 4
    WHEN month LIKE 'Maio%' THEN 5
    WHEN month LIKE 'Junho%' THEN 6
    WHEN month LIKE 'Julho%' THEN 7
    WHEN month LIKE 'Agosto%' THEN 8
    WHEN month LIKE 'Setembro%' THEN 9
    WHEN month LIKE 'Outubro%' THEN 10
    WHEN month LIKE 'Novembro%' THEN 11
    WHEN month LIKE 'Dezembro%' THEN 12
  END,
  year_number = CAST(SUBSTRING(month FROM '.*/(.*)') AS INTEGER),
  due_date = MAKE_DATE(
    CAST(SUBSTRING(month FROM '.*/(.*)') AS INTEGER),
    CASE 
      WHEN month LIKE 'Janeiro%' THEN 1
      WHEN month LIKE 'Fevereiro%' THEN 2
      WHEN month LIKE 'Março%' THEN 3
      WHEN month LIKE 'Abril%' THEN 4
      WHEN month LIKE 'Maio%' THEN 5
      WHEN month LIKE 'Junho%' THEN 6
      WHEN month LIKE 'Julho%' THEN 7
      WHEN month LIKE 'Agosto%' THEN 8
      WHEN month LIKE 'Setembro%' THEN 9
      WHEN month LIKE 'Outubro%' THEN 10
      WHEN month LIKE 'Novembro%' THEN 11
      WHEN month LIKE 'Dezembro%' THEN 12
    END,
    10
  )
WHERE month_number IS NULL OR year_number IS NULL OR due_date IS NULL;

-- 4. Preencher registration_date dos alunos existentes com a data de created_at
UPDATE students
SET registration_date = created_at
WHERE registration_date IS NULL;

-- 5. Criar índices para melhorar performance
CREATE INDEX IF NOT EXISTS idx_payments_due_date ON payments(due_date);
CREATE INDEX IF NOT EXISTS idx_payments_month_year ON payments(month_number, year_number);
CREATE INDEX IF NOT EXISTS idx_students_registration_date ON students(registration_date);

-- 6. Mostrar resumo
SELECT 
  'Colunas adicionadas com sucesso!' as status,
  COUNT(*) as total_pagamentos,
  COUNT(CASE WHEN due_date IS NOT NULL THEN 1 END) as com_due_date,
  COUNT(CASE WHEN month_number IS NOT NULL THEN 1 END) as com_month_number
FROM payments;
