# Checklist de Deploy para Netlify

Use este checklist antes de fazer deploy em produção.

## Fase 1: Setup Local ✓

- [ ] `.env.local` configurado com credenciais Supabase
- [ ] Tabelas criadas no Supabase (`scripts/03-create-users-table.sql`)
- [ ] Usuários de teste inseridos (`scripts/04-seed-users.ts`)
- [ ] Login funcionando localmente (`admin` / `jp974832`)
- [ ] Cadastro de aluno funcionando
- [ ] Alunos aparecem no Supabase

## Fase 2: Preparar para Produção

- [ ] Remover credenciais do `.env.local` antes de fazer push
- [ ] Confirmar que `.env.local` está no `.gitignore`
- [ ] Testar build: `npm run build`
- [ ] Sem erros de TypeScript: `npm run lint`

## Fase 3: Deploy Netlify

- [ ] Fazer push para GitHub: `git push origin main`
- [ ] Conectar repositório no [Netlify](https://netlify.com)
- [ ] Configurar Build:
  - Build command: `npm run build`
  - Publish directory: `.next`

## Fase 4: Variáveis de Ambiente em Produção

No Netlify Dashboard → **Settings → Environment Variables**:

\`\`\`
NEXT_PUBLIC_SUPABASE_URL = seu-url-supabase
NEXT_PUBLIC_SUPABASE_ANON_KEY = sua-anon-key
\`\`\`

**NÃO adicione** `SUPABASE_SERVICE_ROLE_KEY` em produção (usar apenas em scripts locais).

## Fase 5: Verificações Finais

- [ ] Acesse a URL de produção
- [ ] Teste login com `admin` / `jp974832`
- [ ] Teste cadastro de aluno
- [ ] Verifique que alunos aparecem no banco
- [ ] Teste com `treinadores` / `treinar10`

## Troubleshooting

| Erro | Solução |
|------|---------|
| "Supabase not configured" | Verificar env vars no Netlify Dashboard |
| 404 em `/api/auth/login` | Redeployar site |
| "Invalid credentials" | Confirmar seed de usuários foi executado |
