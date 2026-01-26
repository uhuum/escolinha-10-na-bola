# Como Corrigir o Sistema de Pagamentos

## Problema Identificado
1. A aba de pagamentos está zerada
2. Ao cadastrar novos alunos, os pagamentos não são criados automaticamente

## Solução (Execute nesta ordem)

### 1. Primeiro: Adicionar colunas faltantes
Execute este script no SQL Editor do Supabase:
```
EXECUTE_NO_SUPABASE_PAGAMENTOS.sql
```

Este script adiciona as colunas que estão faltando nas tabelas:
- `due_date`, `month_number`, `year_number` na tabela `payments`
- `registration_date`, `is_scholarship`, etc. na tabela `students`

### 2. Segundo: Gerar pagamentos para alunos existentes
Execute este script no SQL Editor do Supabase:
```
GERAR_PAGAMENTOS_ALUNOS_EXISTENTES.sql
```

Este script cria os pagamentos de 2025 e 2026 para todos os alunos que ainda não têm pagamentos cadastrados.

## O que foi corrigido no código

1. **Função `generateStudentPayments`**: Agora verifica se o pagamento já existe antes de inserir
2. **Logs adicionados**: Console logs para debug da criação de pagamentos
3. **Melhor tratamento de erros**: Mensagens mais claras quando algo dá errado

## Como testar

1. Execute os scripts SQL na ordem acima
2. Cadastre um novo aluno no sistema
3. Verifique se os pagamentos aparecem automaticamente na aba "Pagamentos"
4. Verifique se os pagamentos do aluno aparecem no perfil dele

## Segurança

Todos os scripts são SEGUROS:
- ✅ NÃO apagam dados existentes
- ✅ NÃO modificam registros existentes
- ✅ Apenas ADICIONAM novas colunas e registros
- ✅ Usam `IF NOT EXISTS` para evitar erros

## Próximos passos

Após executar os scripts:
1. Limpe o cache do navegador (Ctrl+Shift+R)
2. Recarregue a aplicação
3. A aba de pagamentos deve mostrar todos os alunos com seus pagamentos
