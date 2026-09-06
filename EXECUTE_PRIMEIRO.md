# Configuração Rápida - Faça isto AGORA

## Problema
A tabela `users` não existe no Supabase ainda.

## Solução em 3 passos (5 minutos)

### Passo 1: Configurar Variáveis de Ambiente

Crie um arquivo `.env.local` na raiz do projeto com:

\`\`\`bash
# Frontend (visible no browser)
NEXT_PUBLIC_SUPABASE_URL=https://wvqqfytkjniywsqhcmjp.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Backend (Supabase API)
SUPABASE_URL=https://wvqqfytkjniywsqhcmjp.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
\`\`\`

Encontre essas chaves em: **Supabase Dashboard > Project Settings > API**

### Passo 2: Executar o Script de Setup

\`\`\`bash
# Instalar dependências (se não tiver feito ainda)
npm install

# Executar script que cria tudo
npx ts-node scripts/00-init-db.ts
\`\`\`

**Sucesso?** Você verá:
\`\`\`
✅ Tabela 'users' criada com sucesso!
✅ 'admin' criado
✅ 'treinadores' criado
✅ Setup concluído!
\`\`\`

**Erro sobre 'exec_sql'?** Faça manualmente (próximo passo)

### Passo 3: Criar Tabela Manualmente (Se Necessário)

Se o script falhar:

1. Abra: **Supabase Dashboard > SQL Editor**
2. Cole o conteúdo de: `scripts/03-create-users-table.sql`
3. Clique em **Execute**
4. Volte e rode o script novamente:
   \`\`\`bash
   npx ts-node scripts/00-init-db.ts
   \`\`\`

## Testar Login

1. Rode o servidor: `npm run dev`
2. Vá para: http://localhost:3000/login
3. Teste com:
   - **Usuário:** admin
   - **Senha:** <senha-removida>

Se funcionar, parabéns! Você está pronto! 🎉

## Dúvidas?

- Erro "table not found"? → Você pulou o Passo 3
- Erro "invalid credentials"? → As credenciais estão erradas
- Erro de variáveis? → Verifique se `.env.local` tem a chave correta
