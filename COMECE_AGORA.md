# Comece Agora! 🚀

Siga estes passos **na ordem** para ter o sistema funcionando em 10 minutos.

---

## ⏱️ Tempo Total: ~10 minutos

### ✅ Pré-requisitos
- [ ] Node.js instalado (`node --version`)
- [ ] Conta Supabase criada
- [ ] Git configurado

---

## 📍 PASSO 1: Configurar Variáveis (2 min)

\`\`\`bash
# 1. Copiar arquivo de exemplo
cp .env.example .env.local

# 2. Abrir em editor
# Linux/Mac: nano .env.local
# Windows: notepad .env.local
\`\`\`

**Preencher com:**
\`\`\`
VITE_SUPABASE_URL=https://seu-projeto.supabase.co
VITE_SUPABASE_ANON_KEY=sua-chave-anonima-aqui
\`\`\`

**Como encontrar:**
1. Abrir [supabase.com/dashboard](https://supabase.com/dashboard)
2. Selecionar seu projeto
3. Ir para **Settings → API**
4. Copiar **Project URL** e **anon public key**

✅ **Pronto!** Feche e salve o arquivo.

---

## 📍 PASSO 2: Criar Tabelas (3 min)

### No Supabase Dashboard:

1. Ir para **SQL Editor**
2. Clicar em **New Query**
3. Copiar e colar todo o conteúdo de:
   \`\`\`
   scripts/03-create-users-table.sql
   \`\`\`
4. Clicar em **Run** (ícone ▶️)

**Você verá logs como:**
\`\`\`
CREATE TABLE
CREATE INDEX
ALTER TABLE
CREATE POLICY
\`\`\`

✅ **Pronto!** As tabelas foram criadas.

---

## 📍 PASSO 3: Inserir Usuários (2 min)

### No Supabase SQL Editor, execute:

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

✅ **Pronto!** Dois usuários criados.

---

## 📍 PASSO 4: Iniciar Servidor Local (2 min)

\`\`\`bash
# Instalar dependências (primeira vez)
npm install

# Iniciar servidor
npm run dev

# Você verá:
# ▲ Next.js 16.0.0
# - Local:        http://localhost:3000
\`\`\`

**Abra no navegador:** http://localhost:3000

---

## 📍 PASSO 5: Testar Login (1 min)

### Na tela de login:

1. Clicar em **Administrativo**
2. Preencher:
   - Usuário: `admin`
   - Senha: `<senha-removida>`
3. Clicar em **Entrar**

**Esperado:**
- ✅ Você vê uma splash screen ("Bem-vindo!")
- ✅ Redirecionado para o dashboard
- ✅ Seu nome aparece no menu

**Se não funcionar:**
- Verificar se `.env.local` foi salvo
- Verificar se tabela users foi criada
- Abrir Console (F12) e procurar por erros

---

## 📍 PASSO 6: Testar Cadastro de Aluno (2 min)

### No menu lateral, clicar em **Alunos**

1. Clicar em **Novo Aluno**
2. Preencher:
   - Nome: "João Silva"
   - Responsável: "Maria Silva"
   - CPF Responsável: "123.456.789-00"
   - Horário: "Primeiro Horário (18:00 - 19:30)"
   - Valor: "100"
   - Dias: Selecionar Segunda e Quarta
3. Clicar em **Cadastrar Aluno**

**Esperado:**
- ✅ Toast "Aluno cadastrado com sucesso!"
- ✅ Redirecionado para lista de alunos
- ✅ João Silva aparece na lista

**Verificar no Supabase:**
1. Ir para **SQL Editor → Browse → students**
2. Você deve ver "João Silva" na tabela

---

## 🎉 Parabéns!

Você concluiu o setup! Agora pode:

- ✅ Fazer login
- ✅ Cadastrar alunos
- ✅ Ver dados em tempo real no Supabase

---

## 🆘 Problemas Comuns

### "<!DOCTYPE" no Login
\`\`\`
Solução: Você não executou o Passo 2 (criar tabelas)
→ Abra Supabase SQL Editor e execute scripts/03-create-users-table.sql
\`\`\`

### "Credenciais inválidas"
\`\`\`
Solução: Você não executou o Passo 3 (inserir usuários)
→ Execute o SQL com os usuários no Supabase SQL Editor
\`\`\`

### ".env.local não carrega"
\`\`\`
Solução: Arquivo salvo em local errado ou com formatação errada
→ Execute: cp .env.example .env.local
→ E preencha manualmente com suas credenciais
\`\`\`

### "Cannot find module"
\`\`\`
Solução: Dependências não instaladas
→ Execute: npm install
→ Depois: npm run dev
\`\`\`

---

## 📚 Próximas Etapas

Depois que tudo funcionar:

1. **Explorar o sistema**
   - Testar com treinador (`treinadores` / `<senha-removida>`)
   - Cadastrar mais alunos
   - Ver relatórios

2. **Fazer Deploy** (ver `CHECKLIST_DEPLOY.md`)
   - Push para GitHub
   - Conectar no Netlify
   - Adicionar env vars em produção

3. **Customizações** (futuro)
   - Adicionar upload de comprovantes
   - Gerar relatórios em PDF
   - Integrar notificações por email

---

## ✨ Você está pronto!

Qualquer dúvida:
- Consulte `SETUP_LOCAL.md` para mais detalhes
- Consulte `STATUS_IMPLEMENTACAO.md` para ver o que foi feito
- Abra Console (F12) para ver logs de erro

**Sucesso!** 🚀
