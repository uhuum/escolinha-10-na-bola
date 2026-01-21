# Guia Completo de Migração para Produção

## IMPORTANTE: Sobre os Comandos SQL

**Os comandos SQL são 100% SEGUROS e NÃO excluem dados existentes!**

- Usamos `ADD COLUMN IF NOT EXISTS` - só adiciona se não existir
- Dados existentes permanecem intactos
- Políticas RLS continuam funcionando

---

## PARTE 1: Comandos SQL para o Banco de Dados

Execute no SQL Editor do Supabase ou qualquer cliente PostgreSQL:

\`\`\`sql
-- ================================================
-- MIGRAÇÃO SEGURA - NÃO EXCLUI DADOS EXISTENTES
-- ================================================

-- Tabela students: adicionar campos de bolsista e configurações de horários
ALTER TABLE students ADD COLUMN IF NOT EXISTS is_scholarship BOOLEAN DEFAULT FALSE;
ALTER TABLE students ADD COLUMN IF NOT EXISTS schedule_configs JSONB DEFAULT '[]'::jsonb;

-- Tabela payments: adicionar campos de cobrança
ALTER TABLE payments ADD COLUMN IF NOT EXISTS charged_at TEXT;
ALTER TABLE payments ADD COLUMN IF NOT EXISTS charged_month TEXT;
\`\`\`

### Verificar se funcionou:

\`\`\`sql
SELECT column_name, data_type, column_default
FROM information_schema.columns 
WHERE table_name = 'students'
  AND column_name IN ('is_scholarship', 'schedule_configs');

SELECT column_name, data_type, column_default
FROM information_schema.columns 
WHERE table_name = 'payments'
  AND column_name IN ('charged_at', 'charged_month');
\`\`\`

---

## PARTE 2: Arquivos Modificados/Criados

### Arquivos que você precisa atualizar no projeto de produção:

#### 1. Tipos (lib/types.ts)
Adicionar os novos campos no tipo Student:
- `is_scholarship?: boolean`
- `schedule_configs?: ScheduleConfig[]`

E criar o tipo ScheduleConfig:
\`\`\`typescript
export interface ScheduleConfig {
  dayOfWeek: string
  classSchedule: string
}
\`\`\`

#### 2. Arquivos Principais Modificados:

| Arquivo | O que foi alterado |
|---------|-------------------|
| `lib/types.ts` | Adicionado tipos `ScheduleConfig` e campos no `Student` |
| `lib/formatters.ts` | **NOVO** - Re-exporta funções de formatação |
| `app/students/new/page.tsx` | Novo sistema de dias/horários, campo bolsista |
| `app/students/[id]/student-detail-client.tsx` | Mostrar dias/horários, layout corrigido |
| `app/payments/page.tsx` | Modal de pendentes, campo cobrança |
| `app/trainer/dashboard/page.tsx` | Dashboard reformulado, contabilização correta |
| `app/trainer/relatorio/page.tsx` | **NOVO** - Relatório de presenças para treinadores |
| `app/trainer/birthdays/page.tsx` | Aniversariantes para treinadores |
| `app/trainer/carometro/page.tsx` | Removido badge bolsista |
| `app/page.tsx` | Removido ações rápidas |
| `components/app-header.tsx` | Navegação atualizada, removido aniversariantes do treinador |
| `lib/hooks/use-students.tsx` | Suporte aos novos campos |

#### 3. Arquivos Removidos (AppFooter):
O footer foi removido de todas as páginas:
- `app/carometro/page.tsx`
- `app/chamada/page.tsx`
- `app/presencas/page.tsx`
- `app/presencas/[id]/page.tsx`
- `app/students/page.tsx`
- `app/payments/page.tsx`
- `app/students/new/page.tsx`
- `app/students/[id]/student-detail-client.tsx`

---

## PARTE 3: Resumo das Funcionalidades Novas

1. **Cadastro de Aluno**
   - Campo "Aluno Bolsista" (checkbox)
   - Múltiplos dias/horários (ex: Terça 18:00 + Quinta 19:30)
   - Validação de duplicatas

2. **Pagamentos**
   - Modal com lista de pendentes
   - Botão "Marcar como Cobrado" com data
   - Alunos bolsistas aparecem marcados

3. **Treinadores**
   - Dashboard contabilizando turmas e alunos
   - Relatório de presenças igual ao admin
   - Aniversariantes das turmas do treinador
   - Sem acesso a info de bolsista

4. **Footer Removido**
   - Todas as páginas agora sem o footer SIGA

---

## Ordem de Execução

1. **Primeiro**: Execute os comandos SQL no banco
2. **Segundo**: Atualize os arquivos do projeto
3. **Terceiro**: Faça deploy da aplicação
4. **Quarto**: Teste as funcionalidades
