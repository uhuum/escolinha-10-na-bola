# Verificação de Dados em Produção

## ⚠️ Antes de Executar o Script RLS

### 1. Faça um Backup dos Dados
```sql
-- Executar no Supabase SQL Editor:
SELECT * FROM public.students LIMIT 1;
SELECT COUNT(*) FROM public.students;

SELECT * FROM public.payments LIMIT 1;
SELECT COUNT(*) FROM public.payments;

SELECT * FROM public.attendance LIMIT 1;
SELECT COUNT(*) FROM public.attendance;
```

### 2. Anote os Totais
- Total de Alunos: _______
- Total de Pagamentos: _______
- Total de Presenças: _______

## 📋 Executando o Script Seguro

### Passo 1: Abra o Supabase SQL Editor
1. Acesse seu projeto Supabase
2. Vá em: **SQL Editor**
3. Clique em **New Query**

### Passo 2: Cole o Script
```
Copie todo o conteúdo de: /scripts/39-safe-rls-production.sql
Cole no SQL Editor
Clique em "Run"
```

### Passo 3: Verifique os Resultados
O script mostrará:
```
Starting RLS configuration...
total_students: [número]
total_payments: [número]

...

Verification after RLS configuration:
total_students_after: [deve ser o MESMO número]
total_payments_after: [deve ser o MESMO número]

✅ RLS policies configured successfully! All data preserved!
```

## ✅ Após Executar o Script

### 1. Verificar Integridade dos Dados
```sql
-- Todos os COUNT devem ser iguais aos anotados anteriormente
SELECT COUNT(*) FROM public.students;
SELECT COUNT(*) FROM public.payments;
SELECT COUNT(*) FROM public.attendance;
```

### 2. Testar Acesso na Aplicação
1. Redeploy a aplicação no Vercel
2. Abra F12 (Developer Tools)
3. Vá em **Console**
4. Procure por:
   - ✅ `[v0] ✅ Data fetched successfully`
   - ❌ Se houver erros, verifique as mensagens

### 3. Verificar Dados na UI
- Página de Alunos: Todos os alunos devem aparecer
- Página de Pagamentos: Todos os pagamentos devem aparecer
- Histórico: Nenhum dado deve estar faltando

## 🔍 O que o Script Faz

✅ **FAZ:**
- Ativa as políticas RLS (Row Level Security)
- Permite acesso de usuários autenticados
- Conta dados antes e depois
- Verifica integridade

❌ **NÃO FAZ:**
- ❌ Deleta alunos
- ❌ Deleta pagamentos
- ❌ Apaga presença
- ❌ Modifica valores
- ❌ Altera estrutura das tabelas

## 📞 Se Algo Deu Errado

Se vir erro como `new row violates row level security policy`:
1. Isto significa que o RLS está ativo mas as políticas estão incorretas
2. Execute o script novamente
3. Se persisti, abra suporte no Supabase

Se vir erro de autenticação:
1. Verifique as variáveis de ambiente em Vercel
2. Confirme que `NEXT_PUBLIC_SUPABASE_URL` e `NEXT_PUBLIC_SUPABASE_ANON_KEY` estão corretas
3. Redeploy a aplicação

## 📊 Comparação de Dados

| Tabela | Antes | Depois | Deve Ser Igual |
|--------|-------|--------|---|
| students | ____ | ____ | ✅ SIM |
| payments | ____ | ____ | ✅ SIM |
| attendance | ____ | ____ | ✅ SIM |
