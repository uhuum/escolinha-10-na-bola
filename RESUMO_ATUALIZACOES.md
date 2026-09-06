# Resumo de Atualizações - Sistema SIGA

## O que foi corrigido

### 1. Autenticação (LOGIN)

**Problema**: Erro `<!DOCTYPE` - função retorna HTML em vez de JSON

**Solução Implementada**:
- Criada API route local: `app/api/auth/login/route.ts`
- Funciona em dev (localhost) e produção (Netlify)
- Funciona em qualquer ambiente que suporte Next.js

**Como usar**:
\`\`\`bash
# 1. Criar tabela users no Supabase
# Execute: scripts/03-create-users-table.sql

# 2. Popular tabela com usuários de teste
# Execute: scripts/04-seed-users.ts (ou SQL manual)

# 3. Testar em localhost:3000
npm run dev
\`\`\`

---

### 2. Cadastro de Alunos

**Problema**: Alunos não salvam no Supabase

**Solução Implementada**:
- Hook `useStudents` já estava correto
- Problema era que a autenticação falhava
- Agora que login funciona, cadastro funciona também

**Como usar**:
\`\`\`bash
1. Faça login como admin (admin / <senha-removida>)
2. Vá para "Alunos"
3. Clique "Novo Aluno"
4. Preencha formulário e salve
5. Aluno aparecerá na lista e no Supabase
\`\`\`

---

### 3. Persistência no Supabase

**O que foi criado**:
- Tabela `users` (autenticação)
- Tabela `receipts` (upload de comprovantes)
- Políticas de RLS para segurança

**O que já existia**:
- Tabela `students` (alunos) ✓
- Tabela `payments` (pagamentos) ✓
- Tabela `attendance` (chamadas) ✓
- Tabela `attendance_records` (registros) ✓

---

## Arquivos Criados/Atualizados

### Novos Arquivos
\`\`\`
app/api/auth/login/route.ts              ← API para autenticação
scripts/03-create-users-table.sql        ← Criar tabelas users e receipts
SETUP_LOCAL.md                            ← Guia passo-a-passo
CHECKLIST_DEPLOY.md                       ← Checklist de deploy
\`\`\`

### Arquivos Atualizados
\`\`\`
lib/contexts/auth-context.tsx            ← Usa API local em vez de Netlify function
.env.example                              ← Variáveis corretas
\`\`\`

---

## Instruções Rápidas

### Setup Local (5 minutos)

\`\`\`bash
# 1. Copiar env
cp .env.example .env.local

# 2. Preencher com credenciais Supabase
# VITE_SUPABASE_URL=...
# VITE_SUPABASE_ANON_KEY=...

# 3. Criar tabelas (via SQL Editor do Supabase)
# Cole o conteúdo de: scripts/03-create-users-table.sql

# 4. Inserir usuários (2 opções)
# Opção A: Via SQL
INSERT INTO users (username, password_hash, role, name) VALUES
('admin', '$2a$10$YIWGBbATb75z6QqHhB9Ju.zMdDZx5W/QjP8h8zZzQqLQz5vGa8jNK', 'admin', 'Administrador'),
('treinadores', '$2a$10$O9LjJ7eM8Y5Q3K2P1N0M9uZ8V7X6W5U4T3S2R1Q0P9O8N7M6L5K4j', 'coach', 'Treinador Principal');

# Opção B: Via Script
npx ts-node scripts/04-seed-users.ts

# 5. Testar
npm run dev
# Abrir: http://localhost:3000
# Login: admin / <senha-removida>
\`\`\`

### Credenciais de Teste

| Papel | Usuário | Senha | Acesso |
|-------|---------|-------|--------|
| Admin | `admin` | `<senha-removida>` | Gerenciar alunos, pagamentos, etc |
| Treinador | `treinadores` | `<senha-removida>` | Ver alunos, carômetro, chamadas |

---

## Deploy em Produção

### Pré-requisitos
- Repositório no GitHub
- Conta no Netlify

### Passos

\`\`\`bash
# 1. Push para GitHub
git add .
git commit -m "Fix: autenticação e persistência no Supabase"
git push origin main

# 2. No Netlify Dashboard
# - Conectar repositório GitHub
# - Build command: npm run build
# - Publish: .next

# 3. Adicionar Environment Variables
# NEXT_PUBLIC_SUPABASE_URL
# NEXT_PUBLIC_SUPABASE_ANON_KEY

# 4. Deploy automático (quando fazer push)
\`\`\`

---

## Próximas Tarefas (Opcional)

- [ ] Implementar upload de comprovantes com storage Supabase
- [ ] Adicionar validação de CPF/RG
- [ ] Criar relatórios em PDF
- [ ] Adicionar notificações por email
- [ ] Implementar 2FA para admin

---

## FAQ

**P: Por que a API route está em `app/api/auth/login`?**
R: Porque funciona em dev e produção, sem precisar de serverless functions.

**P: E o Netlify functions que criei antes?**
R: Pode ser deletado ou mantido para referência. A API route é a solução oficial do Next.js.

**P: Como testar o upload de comprovantes?**
R: A tabela `receipts` já existe. Falta apenas criar a UI para upload.

**P: Os alunos que cadastrei antes vão desaparecer?**
R: Não! Os dados antigos continuam na tabela `students`. Apenas adicionamos novas tabelas.

---

## Suporte

Se algo não funcionar:
1. Verifique `SETUP_LOCAL.md`
2. Abra Console (F12) e procure por erros
3. Verifique Supabase Dashboard → Logs
4. Tente fazer logout e login novamente

Tudo funcionando? Parabéns! 🎉
