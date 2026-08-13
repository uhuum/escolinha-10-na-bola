-- Script para gerar pagamentos para todos os alunos existentes
-- Este script cria registros de pagamentos mensais desde a data de registro até dezembro de 2026

-- Remover pagamentos duplicados primeiro (se existirem)
DELETE FROM payments a USING payments b
WHERE a.id > b.id 
  AND a.student_id = b.student_id 
  AND a.month = b.month;

-- Função para gerar pagamentos mensais para um aluno
CREATE OR REPLACE FUNCTION generate_student_payments(
  p_student_id UUID,
  p_monthly_value NUMERIC,
  p_is_scholarship BOOLEAN,
  p_registration_date TIMESTAMPTZ
) RETURNS VOID AS $$
DECLARE
  v_start_date DATE;
  v_end_date DATE;
  v_current_date DATE;
  v_month_name TEXT;
  v_month_number INTEGER;
  v_year INTEGER;
  v_status TEXT;
  v_is_charged BOOLEAN;
  month_names TEXT[] := ARRAY['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 
                               'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
BEGIN
  -- Data de início: primeiro dia do mês de registro ou dezembro de 2025
  v_start_date := GREATEST(
    DATE_TRUNC('month', COALESCE(p_registration_date, '2025-12-01'::TIMESTAMPTZ))::DATE,
    '2025-12-01'::DATE
  );
  
  -- Data final: dezembro de 2026
  v_end_date := '2026-12-31'::DATE;
  
  -- Iterar mês a mês
  v_current_date := v_start_date;
  
  WHILE v_current_date <= v_end_date LOOP
    -- Obter mês e ano
    v_month_number := EXTRACT(MONTH FROM v_current_date);
    v_year := EXTRACT(YEAR FROM v_current_date);
    
    -- Formatar o nome do mês (ex: "Dezembro/2025")
    v_month_name := month_names[v_month_number] || '/' || v_year::TEXT;
    
    -- Determinar status baseado na data atual e tipo de aluno
    IF p_is_scholarship OR p_monthly_value = 0 THEN
      v_status := 'Bolsista';
      v_is_charged := FALSE;
    ELSIF v_current_date > CURRENT_DATE THEN
      v_status := 'Em Aberto';
      v_is_charged := FALSE;
    ELSIF v_current_date < DATE_TRUNC('month', CURRENT_DATE) THEN
      -- Meses passados que não foram pagos
      v_status := 'Não Pagou';
      v_is_charged := FALSE;
    ELSE
      -- Mês atual
      v_status := 'Em Aberto';
      v_is_charged := FALSE;
    END IF;
    
    -- Inserir ou atualizar o pagamento (upsert)
    INSERT INTO payments (
      student_id,
      month,
      value,
      status,
      is_charged,
      created_at,
      updated_at
    )
    VALUES (
      p_student_id,
      v_month_name,
      p_monthly_value,
      v_status,
      v_is_charged,
      NOW(),
      NOW()
    )
    ON CONFLICT (student_id, month)
    DO UPDATE SET
      value = EXCLUDED.value,
      updated_at = NOW();
    
    -- Avançar para o próximo mês
    v_current_date := (v_current_date + INTERVAL '1 month')::DATE;
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Gerar pagamentos para todos os alunos existentes
DO $$
DECLARE
  student_record RECORD;
  total_students INTEGER := 0;
  processed_students INTEGER := 0;
  v_registration_date TIMESTAMPTZ;
BEGIN
  -- Contar total de alunos
  SELECT COUNT(*) INTO total_students FROM students;
  
  RAISE NOTICE 'Iniciando geração de pagamentos para % alunos...', total_students;
  
  -- Para cada aluno
  FOR student_record IN 
    SELECT 
      id,
      monthly_value,
      is_scholarship,
      registration_date,
      created_at,
      name
    FROM students
    ORDER BY created_at
  LOOP
    -- Converter registration_date (TEXT) para TIMESTAMPTZ, com fallback para created_at
    BEGIN
      IF student_record.registration_date IS NOT NULL AND student_record.registration_date != '' THEN
        -- Tentar converter de TEXT para TIMESTAMPTZ
        v_registration_date := student_record.registration_date::TIMESTAMPTZ;
      ELSE
        v_registration_date := student_record.created_at;
      END IF;
    EXCEPTION WHEN OTHERS THEN
      -- Se houver erro na conversão, usar created_at
      v_registration_date := student_record.created_at;
      RAISE NOTICE 'Aviso: Não foi possível converter registration_date para aluno %, usando created_at', student_record.name;
    END;
    
    -- Gerar pagamentos para este aluno
    PERFORM generate_student_payments(
      student_record.id,
      student_record.monthly_value,
      COALESCE(student_record.is_scholarship, FALSE),
      v_registration_date
    );
    
    processed_students := processed_students + 1;
    
    -- Log a cada 10 alunos processados
    IF processed_students % 10 = 0 THEN
      RAISE NOTICE 'Processados % de % alunos...', processed_students, total_students;
    END IF;
  END LOOP;
  
  RAISE NOTICE 'Concluído! Pagamentos gerados para % alunos.', processed_students;
  
  -- Mostrar estatísticas
  RAISE NOTICE '---';
  RAISE NOTICE 'Total de registros de pagamentos criados: %', (SELECT COUNT(*) FROM payments);
  RAISE NOTICE 'Alunos com pagamentos: %', (SELECT COUNT(DISTINCT student_id) FROM payments);
END $$;

-- Verificar resultados
SELECT 
  'Total de alunos' as tipo,
  COUNT(*) as quantidade
FROM students
UNION ALL
SELECT 
  'Total de pagamentos' as tipo,
  COUNT(*) as quantidade
FROM payments
UNION ALL
SELECT 
  'Alunos com pagamentos' as tipo,
  COUNT(DISTINCT student_id) as quantidade
FROM payments
UNION ALL
SELECT 
  'Pagamentos status Pago' as tipo,
  COUNT(*) as quantidade
FROM payments
WHERE status = 'Pago'
UNION ALL
SELECT 
  'Pagamentos status Não Pagou' as tipo,
  COUNT(*) as quantidade
FROM payments
WHERE status = 'Não Pagou'
UNION ALL
SELECT 
  'Pagamentos status Em Aberto' as tipo,
  COUNT(*) as quantidade
FROM payments
WHERE status = 'Em Aberto'
UNION ALL
SELECT 
  'Pagamentos status Bolsista' as tipo,
  COUNT(*) as quantidade
FROM payments
WHERE status = 'Bolsista';

-- Limpar função temporária
DROP FUNCTION IF EXISTS generate_student_payments(UUID, NUMERIC, BOOLEAN, TIMESTAMPTZ);
