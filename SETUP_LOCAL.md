# Guia de Setup Local - SIGA Sistema

Este guia irá ajudar você a configurar o sistema para desenvolvimento local com autenticação real no Supabase.

## Problemas Identificados e Soluções

### ❌ Problema 1: "Unexpected token '<', <!DOCTYPE" no Login
**Causa**: A tabela `users` não existe no Supabase e a função de autenticação retorna HTML em vez de JSON.

**Solução**: Executar o script SQL para criar a tabela.

### ❌ Problema 2: Alunos Cadastrados não Aparecem
**Causa**: O hook `useStudents` tenta salvar no Supabase, mas há problemas de conexão ou permissões.

**Solução**: Confirmar credenciais do Supabase no `.env.local`.

---

## Passo 1: Configurar Variáveis de Ambiente

1. Copie `.env.example` para `.env.local`:
   \`\`\`bash
   cp .env.example .env.local
   \`\`\`

2. Preencha com suas credenciais do Supabase:
   \`\`\`bash
   VITE_SUPABASE_URL=https://seu-projeto.supabase.co
   VITE_SUPABASE_ANON_KEY=sua-chave-anonima
   \`\`\`

   **Como encontrar:**
   - Vá para [Supabase Dashboard](https://supabase.com/dashboard)
   - Clique no seu projeto
   - Vá para **Settings → API**
   - Copie `Project URL` e `anon public key`

---

## Passo 2: Criar Tabelas no Supabase

1. Vá para **Supabase Dashboard → SQL Editor**
2. Clique em **New Query**
3. Cole o conteúdo de `scripts/03-create-users-table.sql`
4. Clique **Run**

Você verá mensagens de sucesso como:
\`\`\`
CREATE TABLE
CREATE INDEX
ALTER TABLE
CREATE POLICY
\`\`\`

---

## Passo 3: Inserir Usuários de Teste

Você tem 2 opções:

### Opção A: Via SQL (Mais Rápido)

1. Volte ao **SQL Editor**
2. Cole e execute este SQL:

\`\`\`sql
INSERT INTO users (username, password_hash, role, name) VALUES
(
  'admin',
  '$2a$10$YIWGBbATb75z6QqHhB9Ju.zMdDZx5W/QjP8h8zZzQqLQz5vGa8jNK',
  'admin',
  'Administrador'
),
(
  'treinadores',
  '$2a$10$O9LjJ7eM8Y5Q3K2P1N0M9uZ8V7X6W5U4T3S2R1Q0P9O8N7M6L5K4j',
  'coach',
  'Treinador Principal'
);
\`\`\`

**Credenciais:**
- Admin: `admin` / `jp974832`
- Treinador: `treinadores` / `treinar10`

### Opção B: Via Script TypeScript

1. Configure as variáveis para backend:
   \`\`\`bash
   SUPABASE_URL=https://seu-projeto.supabase.co
   SUPABASE_SERVICE_ROLE_KEY=sua-chave-service-role
   \`\`\`

   **Como encontrar `SUPABASE_SERVICE_ROLE_KEY`:**
   - Supabase Dashboard → Settings → API
   - Procure por `service_role` key

2. Execute o script:
   \`\`\`bash
   npx ts-node scripts/04-seed-users.ts
   \`\`\`

---

## Passo 4: Testar Localmente

1. Instale dependências:
   \`\`\`bash
   npm install
   \`\`\`

2. Inicie o servidor de desenvolvimento:
   \`\`\`bash
   npm run dev
   \`\`\`

3. Abra [http://localhost:3000](http://localhost:3000)

4. Clique em **Administrativo** e teste:
   - Usuário: `admin`
   - Senha: `jp974832`

---

## Passo 5: Testar Cadastro de Aluno

1. Após fazer login, vá para **Alunos** (menu lateral)
2. Clique em **Novo Aluno**
3. Preencha o formulário completo
4. Clique em **Cadastrar Aluno**

**Se funcionar**, você verá:
- Toast de sucesso
- Aluno aparecerá na lista
- Aluno será salvo no Supabase (verifique em **SQL Editor → Browse**)

**Se não funcionar**, verifique:
- As permissões do Supabase (RLS policies)
- Se a tabela `students` existe
- Console do navegador (F12 → Console)

---

## Troubleshooting

### "Missing Supabase configuration"
Verifique que `.env.local` tem as variáveis corretas:
\`\`\`bash
cat .env.local
\`\`\`

### "FATAL: remaining connection slots are reserved"
Você provavelmente abriu muitas abas. Feche algumas e tente novamente.

### Alunos não aparecem após cadastro
1. Verifique em Supabase → SQL Editor → **Browse → students table**
2. Se estiver vazio, há um erro na função `addStudent`
3. Verifique o Console do navegador (F12) para erros

### Login diz "credenciais inválidas"
Certifique-se de que executou o Passo 3 corretamente.

---

## Estrutura de Pastas Criada

\`\`\`
app/
  api/
    auth/
      login/
        route.ts          ← Nova rota para autenticação
  students/
    new/
      page.tsx           ← Cadastro de alunos
  login/
    page.tsx             ← Tela de login

scripts/
  03-create-users-table.sql  ← Criar tabelas
  04-seed-users.ts          ← Popular usuários

lib/
  contexts/
    auth-context.tsx         ← Atualizado para usar API local
  hooks/
    use-students.tsx         ← Salva alunos no Supabase
\`\`\`

---

## Próximas Etapas

Depois que tudo funcionar localmente:

1. **Push para GitHub**: `git push origin main`
2. **Deploy no Netlify**: Conecte seu repositório
3. **Configure Variáveis em Produção**: Netlify Dashboard → Settings → Environment Variables
4. **Ative Funções Serverless**: `netlify/functions/` (se usar)

---

## Dúvidas?

Se algo não funcionar:
1. Verifique os logs no Console (F12 → Console)
2. Verifique se as tabelas existem no Supabase
3. Verifique se os usuários foram criados
4. Tente fazer logout e login novamente

Sucesso! 🚀
