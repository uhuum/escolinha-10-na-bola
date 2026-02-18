# Guia de Deploy em Produção

## Problema Identificado
A página de pagamentos funciona em desenvolvimento mas não em produção. A causa é geralmente relacionada a:
1. **RLS (Row Level Security)** bloqueando queries
2. **Variáveis de ambiente** não configuradas
3. **Políticas de segurança** do Supabase

## ✅ Solução Passo a Passo

### 1. Executar Script de RLS

Acesse seu Supabase Dashboard e execute o script SQL abaixo no SQL Editor:

**Caminho:** Seu Projeto → SQL Editor → New Query

Copie o conteúdo do arquivo `/scripts/38-fix-rls-production.sql` e execute-o.

Este script:
- Habilita RLS nas tabelas `students`, `payments` e `receipts`
- Cria políticas que permitem usuários autenticados ler/escrever dados
- Garante que os dados não sejam bloqueados por segurança

### 2. Verificar Variáveis de Ambiente

No Vercel (ou sua plataforma de deploy), certifique-se que:

```
NEXT_PUBLIC_SUPABASE_URL=https://seu-projeto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua-chave-anonima-aqui
```

### 3. Verificar Logs em Produção

Se ainda houver problema, abra o DevTools (F12) e procure por mensagens como:

```
[v0] ❌ Students fetch error:
[v0] ❌ Payments fetch error:
```

Isso indicará qual é o erro exato do Supabase.

### 4. Checklist Final

- [ ] Script RLS executado no Supabase
- [ ] Variáveis de ambiente configuradas no deploy
- [ ] Teste uma requisição no DevTools
- [ ] Verifique se alunos aparecem na página de pagamentos
- [ ] Verifique se pode atualizar status de pagamento

## 🔍 Debuggando Problemas Comuns

### "Erro ao carregar alunos" em produção
- Significa que RLS está bloqueando o acesso
- Solução: Execute o script `/scripts/38-fix-rls-production.sql`

### "Erro ao carregar pagamentos" em produção
- RLS pode estar bloqueando tabela de pagamentos
- Solução: Verifique que o script foi executado corretamente

### Alunos aparecem mas pagamentos não sincronizam
- Pode ser RLS ou falta de dados
- Solução: Verifique os logs no DevTools

## Suporte
Se tiver dúvidas, verifique os logs em tempo real no DevTools do navegador (F12 → Console)
