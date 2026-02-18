# Guia de Troubleshooting

## Erro: "Could not find the table 'public.users'"

**Causa:** A tabela `users` não foi criada no Supabase.

**Solução:**

### Opção 1: Automática (Recomendado)
\`\`\`bash
npm run db:init
\`\`\`

### Opção 2: Manual
1. Supabase Dashboard > SQL Editor
2. Copie conteúdo de `scripts/03-create-users-table.sql`
3. Cole e clique Execute
4. Tente fazer login novamente

---

## Erro: "Invalid credentials"

**Causa:** Usuários ainda não foram inseridos no banco.

**Solução:**

\`\`\`bash
npm run db:seed
\`\`\`

Se falhar, execute manualmente:
1. Vá para Supabase Dashboard > Table Editor
2. Abra tabela `users`
3. Insira registros com estrutura:

\`\`\`
username | password_hash (bcrypt) | role | name
admin    | $2a$10$... (jp974832)   | admin | Administrador
treinadores | $2a$10$... (treinar10) | coach | Treinador Principal
\`\`\`

---

## Erro: "SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY not found"

**Causa:** Variáveis de ambiente não configuradas.

**Solução:**

1. Crie arquivo `.env.local` na raiz:
\`\`\`bash
NEXT_PUBLIC_SUPABASE_URL=https://wvqqfytkjniywsqhcmjp.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_URL=https://wvqqfytkjniywsqhcmjp.supabase.co
SUPABASE_SERVICE_ROLE_KEY=...
\`\`\`

2. Encontre as chaves:
   - Supabase Dashboard
   - Project Settings > API
   - Role: Copie a `anon key` E a `service role key`

---

## Cadastro de Aluno Não Funciona

**Verificar:**

1. Login funciona?
   - Se não, veja "Erro: Invalid credentials"
   - Se sim, continue...

2. Tabela `students` existe?
   - Supabase > Table Editor > veja se tem `students`
   - Se não, execute: `scripts/01-create-tables.sql`

3. Permissões RLS?
   - Supabase > Authentication > Policies
   - Verifique se há políticas INSERT na tabela `students`

---

## Arquivo `.env.local` Não é Lido

**Solução:**

1. Pare o servidor (`Ctrl+C`)
2. Delete arquivo `.next` (cache)
3. Restartar: `npm run dev`

---

## Senha de Teste Não Funciona

Tente com a senha em hash bcrypt. Se não funcionar:

1. Apague o registro do usuário no Supabase
2. Execute: `npm run db:seed`

---

## Ainda com Problemas?

1. Verifique arquivo `STATUS_IMPLEMENTACAO.md` para status técnico
2. Veja logs no console do navegador (F12)
3. Veja logs no terminal (onde rodou `npm run dev`)
