-- ====================================================
-- Script de Limpeza e Organização do Banco de Dados
-- ====================================================
-- Corrige pagamentos, garante 12 meses de pagamento
-- Cria índices e exibe resumo final
-- ====================================================

-- 1. Verificação inicial
SELECT 'Verificando dados...' AS status;

-- 2. Atualizar todos os pagamentos com recibo para status "Pago"
-- Corrigido COALESCE para tipos compatíveis (timestamp)
UPDATE payments
SET 
    status = 'Pago',
    paid_at = COALESCE(paid_at::timestamp, updated_at, created_at),
    updated_at = NOW()
WHERE receipt IS NOT NULL
  AND receipt != ''
  AND status != 'Pago';

-- 3. Criar índices para melhor performance (se não existirem)
CREATE INDEX IF NOT EXISTS idx_payments_student_id ON payments(student_id);
CREATE INDEX IF NOT EXISTS idx_payments_month ON payments(month);
CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status);
CREATE INDEX IF NOT EXISTS idx_students_name ON students(name);
CREATE INDEX IF NOT EXISTS idx_students_is_active ON students(is_active);

-- 4. Garantir que todos os alunos tenham 12 meses de pagamento
DO $$
DECLARE
    student_record RECORD;
    month_name TEXT;
    payment_exists BOOLEAN;
    all_months TEXT[] := ARRAY[
        'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
        'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
    ];
BEGIN
    FOR student_record IN SELECT id, monthly_value FROM students LOOP
        FOREACH month_name IN ARRAY all_months LOOP
            SELECT EXISTS(
                SELECT 1 FROM payments
                WHERE student_id = student_record.id
                  AND month = month_name
            ) INTO payment_exists;

            IF NOT payment_exists THEN
                INSERT INTO payments (
                    student_id, month, status, value, created_at, updated_at
                ) VALUES (
                    student_record.id,
                    month_name,
                    'Em Aberto',
                    student_record.monthly_value,
                    NOW(),
                    NOW()
                );
            END IF;
        END LOOP;
    END LOOP;
END $$;

-- 5. Mostrar resumo final
SELECT 'Total de alunos' AS tipo, COUNT(*)::text AS quantidade FROM students
UNION ALL
SELECT 'Alunos ativos' AS tipo, COUNT(*)::text AS quantidade FROM students WHERE is_active = true
UNION ALL
SELECT 'Pagamentos pagos' AS tipo, COUNT(*)::text AS quantidade FROM payments WHERE status = 'Pago'
UNION ALL
SELECT 'Pagamentos pendentes' AS tipo, COUNT(*)::text AS quantidade FROM payments WHERE status IN ('Em Aberto','Não Pagou','Cobrado');

SELECT 'Banco de dados organizado com sucesso!' AS status;
