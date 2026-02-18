# Atualização do Sistema de Pagamentos

## Mudanças Realizadas

### 1. Simplificação do Processo de Pagamento

**Antes:**
- Ao dar baixa em um pagamento PIX, era necessário anexar comprovante
- Processo em 2 etapas: escolher tipo → fazer upload

**Agora:**
- Ao dar baixa, basta escolher entre Dinheiro ou PIX
- Não é mais necessário anexar comprovante
- Processo em 1 etapa: escolher tipo → confirmar
- O pagamento é marcado como "Pago" imediatamente

### 2. Geração Automática de Pagamentos

**O que foi implementado:**
- Quando um novo aluno é cadastrado, o sistema automaticamente cria registros de pagamento mensais
- Os pagamentos são gerados desde a data de registro até dezembro de 2026
- O status é definido automaticamente baseado na data:
  - **Meses futuros**: Em Aberto
  - **Mês atual**: Em Aberto
  - **Meses passados**: Não Pagou (se não foi pago)
  - **Bolsistas**: Bolsista (isento)

### 3. Script para Alunos Existentes

**Arquivo:** `scripts/42-generate-payments-all-students.sql`

Este script SQL deve ser executado no Supabase para:
- Gerar pagamentos para todos os alunos que já existem no sistema
- Criar registros desde dezembro/2025 até dezembro/2026
- Remover duplicatas se existirem
- Manter histórico completo de pagamentos

**Como executar:**
1. Acesse o Supabase Dashboard
2. Vá em SQL Editor
3. Cole o conteúdo do arquivo `scripts/42-generate-payments-all-students.sql`
4. Clique em "Run"
5. Aguarde a conclusão (o script mostra o progresso)

### 4. Histórico de Pagamentos

Cada aluno agora tem um histórico completo de pagamentos que inclui:
- Mês/Ano do pagamento
- Valor da mensalidade
- Status (Pago, Não Pagou, Em Aberto, Cobrado, Adiado, Bolsista)
- Data de pagamento (quando aplicável)
- Tipo de pagamento (Dinheiro ou PIX)
- Se foi cobrado via WhatsApp

## Benefícios

1. **Mais Rápido**: Marcar pagamentos agora é muito mais rápido
2. **Menos Complexo**: Não precisa gerenciar comprovantes
3. **Histórico Completo**: Todos os alunos têm registro de todos os meses
4. **Automático**: Novos alunos já vêm com pagamentos gerados
5. **Organizado**: Fácil visualizar pendências e histórico

## Próximos Passos

1. Execute o script SQL no Supabase (item 3 acima)
2. Execute o script `scripts/41-fix-rls-policies-allow-inserts.sql` se ainda tiver erro de RLS
3. Teste cadastrar um novo aluno e verificar se os pagamentos são criados automaticamente
4. Teste dar baixa em um pagamento (escolher Dinheiro ou PIX)
5. Verifique o histórico de pagamentos de cada aluno

## Observações

- Os comprovantes que já foram anexados anteriormente não serão removidos
- A funcionalidade de anexar comprovante foi removida apenas para novos pagamentos
- O sistema de cobrança via WhatsApp continua funcionando normalmente
