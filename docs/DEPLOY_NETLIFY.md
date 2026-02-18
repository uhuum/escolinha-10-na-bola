# Guia de Deploy no Netlify - SIGA

## Visão Geral

Este documento descreve o processo completo de configuração e deploy do SIGA (Sistema Integrado de Gestão de Alunos) no Netlify com persistência Supabase e autenticação real.

## Pré-requisitos

- Conta no [Netlify](https://netlify.com)
- Conta no [Supabase](https://supabase.com)
- Projeto GitHub sincronizado
- Node.js 18+ instalado localmente

## 1. Configuração do Supabase

### 1.1 Criar Projeto Supabase

1. Acesse [supabase.com](https://supabase.com)
2. Clique em "New Project"
3. Escolha um nome e região (preferencialmente próxima ao Brasil)
4. Anote a URL e chaves de acesso

### 1.2 Executar Scripts SQL

1. No Supabase, acesse **SQL Editor**
2. Crie um novo query e copie o conteúdo de `scripts/03-create-users-table.sql`
3. Execute o script
4. Repita para `scripts/05-add-storage-bucket.sql`

### 1.3 Seed de Usuários (Local)

Execute localmente antes de fazer push:

\`\`\`bash
# Instale dependências
npm install bcryptjs

# Configure variáveis de ambiente
export SUPABASE_URL="sua-url-supabase"
export SUPABASE_SERVICE_ROLE_KEY="sua-service-role-key"

# Execute o seed
npx ts-node scripts/04-seed-users.ts
\`\`\`

Usuários criados:
- **Admin**: `admin` / `jp974832`
- **Treinador**: `treinadores` / `treinar10`

## 2. Configuração do Netlify

### 2.1 Conectar Repositório

1. No Netlify, clique "New site from Git"
2. Conecte seu repositório GitHub
3. Selecione o branch principal

### 2.2 Definir Variáveis de Ambiente

1. Acesse **Site settings** → **Build & deploy** → **Environment**
2. Adicione as variáveis:

\`\`\`
# Frontend (com prefixo VITE_)
VITE_SUPABASE_URL = "sua-url-supabase"
VITE_SUPABASE_ANON_KEY = "sua-anon-key"

# Serverless (sem prefixo)
SUPABASE_URL = "sua-url-supabase"
SUPABASE_SERVICE_ROLE_KEY = "sua-service-role-key"
\`\`\`

### 2.3 Configurar Build

**Build command:**
\`\`\`bash
npm run build
\`\`\`

**Publish directory:**
\`\`\`
dist
\`\`\`

**Functions directory:**
\`\`\`
netlify/functions
\`\`\`

### 2.4 Deploy

1. Faça push para o GitHub
2. Netlify detecta automaticamente e faz o build
3. Acesse sua URL ao final do deploy

## 3. Estrutura de Variáveis de Ambiente

### Frontend (.env.local ou Netlify UI)
\`\`\`
VITE_SUPABASE_URL=https://...supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...
\`\`\`

### Serverless (Netlify Environment Variables)
\`\`\`
SUPABASE_URL=https://...supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJ...
\`\`\`

## 4. Criar Bucket no Supabase

1. No Supabase, acesse **Storage**
2. Clique "New bucket"
3. Nome: `receipts`
4. Marque como "Public"
5. Copie e execute `scripts/05-add-storage-bucket.sql` no SQL Editor

## 5. Testar Sistema

### 5.1 Login

1. Acesse sua URL do Netlify
2. Escolha "Administrativo"
3. Use: `admin` / `jp974832`
4. Verifique se aparece a splash screen

### 5.2 Cadastrar Aluno

1. No dashboard, clique "Cadastrar Novo Aluno"
2. Preencha os dados
3. Verifique no Supabase se foi salvo

### 5.3 Upload de Comprovante

1. Na página de pagamentos, selecione um aluno
2. Faça upload de um arquivo PDF
3. Verifique no Storage do Supabase se foi salvo

## 6. Troubleshooting

### "Invalid Supabase credentials"
- Verifique se as variáveis estão corretas no Netlify
- Confirme que não há espaços em branco

### "Function failed"
- Verifique os logs em Netlify → Functions
- Confirme que bcryptjs está no package.json

### "Storage bucket not found"
- Execute `scripts/05-add-storage-bucket.sql` novamente
- Verifique RLS policies no Supabase

### "Dados não salvam"
- Verifique RLS policies no Supabase
- Confirme que o usuário tem permissão de insert

## 7. Segurança

- Nunca commit credenciais no Git
- Use variáveis de ambiente no Netlify
- Supabase RLS protege os dados
- Service Role Key apenas em serverless

## 8. Backup e Manutenção

### Backup do Banco
\`\`\`bash
# Supabase faz backup automático
# Você pode também exportar via:
pg_dump postgresql://user:password@host/db > backup.sql
\`\`\`

### Atualizar Usuários
Execute `scripts/04-seed-users.ts` novamente ou manipule diretamente no Supabase.

## 9. Performance

- CDN do Netlify caches assets
- Supabase otimiza queries com índices
- Considere adicionar cache headers em imagens

## Contato & Suporte

Para dúvidas ou problemas, consulte:
- [Documentação Netlify](https://docs.netlify.com)
- [Documentação Supabase](https://supabase.com/docs)
