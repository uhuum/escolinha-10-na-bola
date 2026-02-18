# SIGA - Implementação Completa

## O que foi implementado

### 1. Splash Screens com Animações
- **SplashStart**: Tela inicial com logo, 1.5s duração
- **SplashRole**: Tela pós-login com welcome message, 1s duração
- Animações suaves em Tailwind CSS
- Logo CEAP centralized em ambas

### 2. Autenticação Real com Supabase
- Tabela `users` com hash bcrypt
- Contexto de autenticação atualizado
- Login sem credenciais teste
- Redireccionamento por role (admin/coach)
- Persistência em localStorage

### 3. Funções Serverless Netlify
- `netlify/functions/login.ts`: Valida credenciais com bcrypt
- `netlify/functions/upload-receipt.ts`: Upload de comprovantes para Storage
- Service Role Key protege operações sensíveis
- Retorna JSON com dados do usuário

### 4. Upload de Comprovantes
- Integrado com Storage Supabase
- Tabela `receipts` rastreia uploads
- URLs públicas para visualização
- RLS protege acesso

### 5. Estrutura de Variáveis de Ambiente
- Frontend: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`
- Serverless: `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`
- Validação automática no cliente Supabase

### 6. Scripts SQL e Seed
- `03-create-users-table.sql`: Tabelas + RLS policies
- `04-seed-users.ts`: Seed com bcrypt (admin + treinador)
- `05-add-storage-bucket.sql`: Storage bucket receipts

### 7. Documentação
- `docs/DEPLOY_NETLIFY.md`: Guia completo de deploy
- `docs/ENVIRONMENT_VARIABLES.md`: Referência de env vars
- Instruções passo-a-passo

## Próximas Ações

### Local (antes de commit)

1. **Instale dependências serverless:**
   \`\`\`bash
   npm install bcryptjs @supabase/supabase-js
   \`\`\`

2. **Configure .env.local:**
   \`\`\`bash
   cp .env.example .env.local
   # Preenchea com suas credenciais Supabase
   \`\`\`

3. **Execute scripts SQL no Supabase:**
   - Abra Supabase Dashboard → SQL Editor
   - Execute `scripts/03-create-users-table.sql`
   - Execute `scripts/05-add-storage-bucket.sql`

4. **Seed de usuários:**
   \`\`\`bash
   npx ts-node scripts/04-seed-users.ts
   \`\`\`

5. **Teste localmente:**
   \`\`\`bash
   npm run dev
   # Abra http://localhost:5173
   # Login: admin / jp974832
   \`\`\`

### Netlify (Deploy)

1. **Conecte repositório GitHub** ao Netlify
2. **Configure variáveis de ambiente:**
   - Site settings → Environment
   - Adicione todas as variáveis (ver docs/ENVIRONMENT_VARIABLES.md)
3. **Deploy automático** ao fazer push no GitHub

## Credenciais Teste

- **Admin**: `admin` / `jp974832`
- **Treinador**: `treinadores` / `treinar10`

Altere após deploy para produção.

## Estrutura de Arquivos Novo

\`\`\`
.
├── components/
│   ├── splash-start.tsx          # Nova
│   ├── splash-role.tsx           # Nova
│   └── ...
├── netlify/
│   └── functions/
│       ├── login.ts              # Nova
│       └── upload-receipt.ts     # Nova
├── scripts/
│   ├── 03-create-users-table.sql # Nova
│   ├── 04-seed-users.ts          # Nova
│   └── 05-add-storage-bucket.sql # Nova
├── docs/
│   ├── DEPLOY_NETLIFY.md         # Nova
│   └── ENVIRONMENT_VARIABLES.md  # Nova
├── lib/
│   ├── supabase/client.ts        # Atualizado
│   └── contexts/auth-context.tsx # Atualizado
├── app/
│   ├── layout.tsx                # Atualizado (Splash)
│   └── login/page.tsx            # Atualizado
└── package.json                  # Atualizar

\`\`\`

## Checklist Final

- [ ] Logo PNG adicionada em `public/logo.png`
- [ ] Variáveis de ambiente configuradas no .env.local
- [ ] Scripts SQL executados no Supabase
- [ ] Seed de usuários executado
- [ ] Teste local funciona
- [ ] Repositório atualizado no GitHub
- [ ] Netlify detecta e faz deploy
- [ ] Variáveis de ambiente adicionadas no Netlify
- [ ] Login funciona em produção
- [ ] Upload de comprovantes funciona
- [ ] Dados persistem após F5

## Support

Ver docs/DEPLOY_NETLIFY.md para troubleshooting e FAQs.
\`\`\`
