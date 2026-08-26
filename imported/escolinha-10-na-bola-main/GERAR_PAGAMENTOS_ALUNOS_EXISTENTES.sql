-- Script SEGURO para gerar pagamentos para alunos existentes
-- Este script NAO APAGA e NAO MODIFICA nenhum registro existente
-- Apenas ADICIONA novos pagamentos onde ainda nao existem

-- 1. Funcao para gerar pagamentos para um aluno (apenas insere novos, nunca atualiza)
CREATE OR REPLACE FUNCTION generate_student_payments_safe(
    p_student_id UUID,
    p_monthly_value NUMERIC,
    p_is_scholarship BOOLEAN DEFAULT FALSE
)
RETURNS INT AS $$
DECLARE
    v_year INT;
    v_month INT;
    v_month_name TEXT;
    v_month_key TEXT;
    v_status TEXT;
    v_current_year INT := EXTRACT(YEAR FROM CURRENT_DATE)::INT;
    v_current_month INT := EXTRACT(MONTH FROM CURRENT_DATE)::INT;
    v_current_day INT := EXTRACT(DAY FROM CURRENT_DATE)::INT;
    v_month_names TEXT[] := ARRAY['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
    v_inserted INT := 0;
BEGIN
    -- Gera pagamentos de 2025 ate 2026
    FOR v_year IN 2025..2026 LOOP
        FOR v_month IN 1..12 LOOP
            v_month_name := v_month_names[v_month];
            v_month_key := v_month_name || '/' || v_year::TEXT;
            
            -- Verifica se ja existe esse pagamento - se existir, NAO FAZ NADA
            IF NOT EXISTS (
                SELECT 1 FROM payments 
                WHERE student_id = p_student_id AND month = v_month_key
            ) THEN
                -- Determina o status inicial
                IF p_is_scholarship OR p_monthly_value = 0 THEN
                    v_status := 'Bolsista';
                ELSIF v_year < v_current_year OR (v_year = v_current_year AND v_month < v_current_month) THEN
                    v_status := 'Não Pagou';
                ELSIF v_year = v_current_year AND v_month = v_current_month THEN
                    IF v_current_day <= 10 THEN
                        v_status := 'Em Aberto';
                    ELSE
                        v_status := 'Não Pagou';
                    END IF;
                ELSE
                    v_status := 'Em Aberto';
                END IF;
                
                -- Insere APENAS se nao existir
                INSERT INTO payments (student_id, month, status, value, created_at, updated_at)
                VALUES (
                    p_student_id,
                    v_month_key,
                    v_status,
                    CASE WHEN p_is_scholarship OR p_monthly_value = 0 THEN 0 ELSE p_monthly_value END,
                    NOW(),
                    NOW()
                );
                
                v_inserted := v_inserted + 1;
            END IF;
        END LOOP;
    END LOOP;
    
    RETURN v_inserted;
END;
$$ LANGUAGE plpgsql;

-- 2. Gera pagamentos APENAS para meses que ainda nao existem (NAO modifica existentes)
DO $$
DECLARE
    r RECORD;
    v_total_inserted INT := 0;
    v_student_inserted INT;
BEGIN
    RAISE NOTICE '=== INICIANDO GERACAO DE PAGAMENTOS (MODO SEGURO) ===';
    RAISE NOTICE 'Este script NAO apaga e NAO modifica registros existentes.';
    RAISE NOTICE '';
    
    FOR r IN SELECT id, name, monthly_value, COALESCE(is_scholarship, false) as is_scholarship FROM students ORDER BY name LOOP
        SELECT generate_student_payments_safe(r.id, r.monthly_value, r.is_scholarship) INTO v_student_inserted;
        
        IF v_student_inserted > 0 THEN
            RAISE NOTICE 'Aluno: % - % novos pagamentos criados', r.name, v_student_inserted;
            v_total_inserted := v_total_inserted + v_student_inserted;
        ELSE
            RAISE NOTICE 'Aluno: % - Todos os pagamentos ja existem (nenhuma alteracao)', r.name;
        END IF;
    END LOOP;
    
    RAISE NOTICE '';
    RAISE NOTICE '=== RESUMO ===';
    RAISE NOTICE 'Total de novos pagamentos inseridos: %', v_total_inserted;
    RAISE NOTICE 'Nenhum registro existente foi modificado ou apagado.';
END $$;

-- 3. Mostra resumo final
SELECT 
    s.name as aluno,
    COUNT(p.id) as total_pagamentos,
    COUNT(CASE WHEN p.status = 'Pago' THEN 1 END) as pagos,
    COUNT(CASE WHEN p.status = 'Em Aberto' THEN 1 END) as em_aberto,
    COUNT(CASE WHEN p.status = 'Não Pagou' THEN 1 END) as nao_pagou,
    COUNT(CASE WHEN p.status = 'Bolsista' THEN 1 END) as bolsista
FROM students s
LEFT JOIN payments p ON p.student_id = s.id
GROUP BY s.id, s.name
ORDER BY s.name;
