# Variáveis de Ambiente - SIGA

## Overview

O SIGA usa diferentes variáveis de ambiente dependendo do contexto:

- **Frontend**: Prefixo `VITE_` (acessível no navegador)
- **Serverless**: Sem prefixo (Netlify/Node.js)
- **Local**: `.env.local` ou `.env`

## Frontend Variables

### VITE_SUPABASE_URL
- **Tipo**: String
- **Descrição**: URL do projeto Supabase
- **Exemplo**: `https://xyzabc.supabase.co`
- **Acessível em**: `import.meta.env.VITE_SUPABASE_URL`

### VITE_SUPABASE_ANON_KEY
- **Tipo**: String
- **Descrição**: Chave pública (anon key) do Supabase
- **Exemplo**: `eyJhbGciOi...`
- **Acessível em**: `import.meta.env.VITE_SUPABASE_ANON_KEY`
- **Segurança**: Visível ao cliente (por design, usar RLS no banco)

## Serverless Variables

### SUPABASE_URL
- **Tipo**: String
- **Descrição**: URL do projeto Supabase
- **Onde**: Configurar em Netlify → Environment

### SUPABASE_SERVICE_ROLE_KEY
- **Tipo**: String
- **Descrição**: Chave de serviço (admin) - **NEVER COMMIT**
- **Onde**: Configurar em Netlify → Environment (não commitar em Git)
- **Segurança**: Usada apenas em funções serverless

## Arquivo .env.local (Desenvolvimento)

\`\`\`env
# Frontend
VITE_SUPABASE_URL=https://xyzabc.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOi...

# Serverless (para testes locais)
SUPABASE_URL=https://xyzabc.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOi...
\`\`\`

## Netlify UI Configuration

1. Site settings → Build & deploy → Environment
2. Adicione as variáveis
3. Redeploy será necessário para aplicar mudanças

## Validação de Variáveis

O código valida automaticamente:

\`\`\`typescript
// lib/supabase/client.ts
const url = process.env.NEXT_PUBLIC_SUPABASE_URL || import.meta.env.VITE_SUPABASE_URL
const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || import.meta.env.VITE_SUPABASE_ANON_KEY

if (!url || !key) {
  throw new Error('Missing Supabase configuration')
}
\`\`\`

## Rotação de Chaves

1. No Supabase, acesse Settings → API
2. Clique "Rotate" em anon key ou service role key
3. Atualize as variáveis no Netlify
4. Redeploy

## Checklist de Segurança

- [ ] Service Role Key nunca está em `.env` commitado
- [ ] Variáveis VITE_ não contêm dados sensíveis além de chaves públicas
- [ ] RLS está ativado nas tabelas Supabase
- [ ] Netlify environment variables são privadas
- [ ] Service role key é usada apenas em netlify/functions/
