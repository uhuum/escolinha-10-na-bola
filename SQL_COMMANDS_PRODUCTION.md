# Comandos SQL para Banco de Dados de Produção

Execute estes comandos SQL no seu banco de dados de produção (Supabase SQL Editor ou qualquer cliente PostgreSQL conectado ao seu banco).

## 1. Adicionar campos na tabela `students`

\`\`\`sql
-- Adicionar campo para marcar aluno como bolsista
ALTER TABLE students ADD COLUMN IF NOT EXISTS is_scholarship BOOLEAN DEFAULT FALSE;

-- Adicionar campo para configurações de horários múltiplos (JSON)
ALTER TABLE students ADD COLUMN IF NOT EXISTS schedule_configs JSONB DEFAULT '[]'::jsonb;
\`\`\`

## 2. Adicionar campos na tabela `payments`

\`\`\`sql
-- Adicionar campo para registrar quando a cobrança foi feita
ALTER TABLE payments ADD COLUMN IF NOT EXISTS charged_at TEXT;

-- Adicionar campo para registrar o mês da cobrança
ALTER TABLE payments ADD COLUMN IF NOT EXISTS charged_month TEXT;
\`\`\`

## 3. Comando completo (executar tudo de uma vez)

\`\`\`sql
-- ================================================
-- MIGRAÇÃO COMPLETA - EXECUTE ESTE BLOCO INTEIRO
-- ================================================

-- Tabela students: adicionar campos de bolsista e configurações de horários
ALTER TABLE students ADD COLUMN IF NOT EXISTS is_scholarship BOOLEAN DEFAULT FALSE;
ALTER TABLE students ADD COLUMN IF NOT EXISTS schedule_configs JSONB DEFAULT '[]'::jsonb;

-- Tabela payments: adicionar campos de cobrança
ALTER TABLE payments ADD COLUMN IF NOT EXISTS charged_at TEXT;
ALTER TABLE payments ADD COLUMN IF NOT EXISTS charged_month TEXT;

-- Verificar se as colunas foram criadas
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'students' 
  AND column_name IN ('is_scholarship', 'schedule_configs');

SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'payments' 
  AND column_name IN ('charged_at', 'charged_month');
\`\`\`

## 4. Verificar se a migração foi bem-sucedida

Após executar os comandos, execute esta consulta para verificar:

\`\`\`sql
-- Verificar estrutura da tabela students
SELECT column_name, data_type, column_default
FROM information_schema.columns 
WHERE table_name = 'students'
ORDER BY ordinal_position;

-- Verificar estrutura da tabela payments
SELECT column_name, data_type, column_default
FROM information_schema.columns 
WHERE table_name = 'payments'
ORDER BY ordinal_position;
\`\`\`

## Notas Importantes

1. **Backup**: Faça um backup do banco antes de executar as migrações
2. **Ambiente**: Certifique-se de que está conectado ao banco de PRODUÇÃO correto
3. **RLS**: As políticas de Row Level Security existentes continuarão funcionando normalmente
4. **Rollback**: Caso precise reverter:

\`\`\`sql
-- APENAS SE NECESSÁRIO - Reverter alterações
ALTER TABLE students DROP COLUMN IF EXISTS is_scholarship;
ALTER TABLE students DROP COLUMN IF EXISTS schedule_configs;
ALTER TABLE payments DROP COLUMN IF EXISTS charged_at;
ALTER TABLE payments DROP COLUMN IF EXISTS charged_month;
