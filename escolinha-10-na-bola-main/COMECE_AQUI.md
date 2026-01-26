# COMECE AQUI - Guia Rápido SIGA

Bem-vindo ao SIGA! Este arquivo é seu ponto de partida.

## O que foi feito?

✅ **Splash screens** com logo CEAP (telas animadas ao iniciar)
✅ **Autenticação real** com usuário/senha no Supabase
✅ **Upload de comprovantes** com storage na nuvem
✅ **Estrutura pronta para Netlify** com funções serverless
✅ **Banco de dados** com tabelas e RLS policies

## 5 Passos Rápidos para Começar

### 1️⃣ Instale as dependências
\`\`\`bash
npm install
\`\`\`

### 2️⃣ Configure o Supabase

1. Crie conta em [supabase.com](https://supabase.com)
2. Copie sua URL e chaves
3. Crie arquivo `.env.local`:
\`\`\`bash
VITE_SUPABASE_URL=sua-url-aqui
VITE_SUPABASE_ANON_KEY=sua-chave-aqui
SUPABASE_URL=sua-url-aqui
SUPABASE_SERVICE_ROLE_KEY=sua-service-key-aqui
\`\`\`

### 3️⃣ Execute os scripts SQL

No Supabase Dashboard → SQL Editor:

1. Copie e execute: `scripts/03-create-users-table.sql`
2. Copie e execute: `scripts/05-add-storage-bucket.sql`

### 4️⃣ Crie os usuários de teste

\`\`\`bash
npm install bcryptjs
npx ts-node scripts/04-seed-users.ts
\`\`\`

Usuários criados:
- **Admin**: `admin` / `jp974832`
- **Treinador**: `treinadores` / `treinar10`

### 5️⃣ Teste localmente

\`\`\`bash
npm run dev
\`\`\`

Abra http://localhost:3000 e faça login!

## Deploy no Netlify

1. Push seu código no GitHub
2. Conecte repo em [netlify.com](https://netlify.com)
3. Adicione variáveis de ambiente no Netlify UI
4. Deploy automático! 🚀

Ver `docs/DEPLOY_NETLIFY.md` para detalhes.

## Arquivos Importantes

| Arquivo | Propósito |
|---------|----------|
| `docs/DEPLOY_NETLIFY.md` | Guia completo de deploy |
| `docs/ENVIRONMENT_VARIABLES.md` | Referência de env vars |
| `IMPLEMENTACAO_COMPLETA.md` | O que foi implementado |
| `netlify.toml` | Config do build |

## Estrutura do Projeto

\`\`\`
app/                  → Páginas Next.js
├── login/page.tsx    → Página de login (novinha!)
└── ...

components/           → Componentes React
├── splash-start.tsx  → Tela inicial
├── splash-role.tsx   → Tela após login
└── ...

lib/
├── contexts/auth-context.tsx  → Autenticação
└── supabase/client.ts         → Client Supabase

netlify/
└── functions/        → Serverless functions
    ├── login.ts      → Verifica credenciais
    └── upload-receipt.ts  → Upload de arquivos

scripts/              → SQL e seeds
├── 03-create-users-table.sql
├── 04-seed-users.ts
└── 05-add-storage-bucket.sql
\`\`\`

## Fluxo de Login

\`\`\`
Usuário → Login Page → Netlify Function → Supabase
                                ↓
                        Valida username/senha
                                ↓
                        Retorna user data
                                ↓
                        SplashRole (1s) → Dashboard
\`\`\`

## Principais Mudanças

- ❌ Credenciais hardcoded → ✅ Banco de dados Supabase
- ❌ Estado local → ✅ Persistência real
- ❌ Login fake → ✅ bcrypt + autenticação real
- ❌ Upload manual → ✅ Storage cloud automático

## Segurança

- Senhas hasheadas com bcrypt
- Service Role Key só em serverless
- RLS protege dados
- Env vars seguras no Netlify

## Precisa de Ajuda?

1. Ver `docs/DEPLOY_NETLIFY.md` - Guia passo-a-passo
2. Ver `docs/ENVIRONMENT_VARIABLES.md` - Dúvidas sobre env
3. Ver `IMPLEMENTACAO_COMPLETA.md` - Detalhes técnicos
4. Ver troubleshooting em `docs/DEPLOY_NETLIFY.md`

## Credenciais de Teste

\`\`\`
Admin:
  Usuário: admin
  Senha: jp974832

Treinador:
  Usuário: treinadores
  Senha: treinar10
\`\`\`

⚠️ **IMPORTANTE**: Alterar essas senhas em produção!

## Próximo?

1. Teste tudo localmente
2. Crie um projeto Netlify
3. Connect seu GitHub
4. Deploy!

Boa sorte! 🎉
