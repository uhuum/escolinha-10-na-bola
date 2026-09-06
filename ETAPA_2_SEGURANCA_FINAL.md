# SIGA — Etapa 2 de Segurança (final)

## Implementado
- Supabase Auth como fonte real da sessão; sem autenticação por localStorage.
- Proteção de rotas no servidor e no cliente para Admin e Treinador.
- Revalidação em Back/Forward (bfcache), evitando tela antiga de outro perfil.
- RLS nas tabelas principais; acesso `anon` removido.
- Financeiro e comprovantes restritos ao Admin no banco.
- `public.users` legado inacessível a `anon`/`authenticated`.
- Login não usa mais a ponte de migração com `service_role`; as duas contas já estão no Supabase Auth.
- Buckets antigos de comprovantes tornados privados e políticas públicas removidas.
- Fotos de alunos em bucket privado; leitura autenticada e mutação de Storage restrita ao Admin.
- API de upload valida sessão, papel Admin, MIME, tamanho e limites de processamento.
- Cabeçalhos HTTP de hardening (HSTS, anti-frame, nosniff, Referrer/Permissions Policy, COOP).
- Respostas de autenticação e APIs sensíveis sem cache.

## Operacional pendente (não é código)
1. Rotacionar a chave secreta/service-role que já foi exposta e atualizar a variável no Netlify.
2. Rotacionar a senha do banco que já foi exposta.
3. Manter MFA/2FA habilitado na conta administrativa do Supabase/GitHub.
4. Leaked Password Protection do Supabase só está disponível no plano Pro ou superior.

## Observação
Nenhum sistema conectado à internet pode ser classificado como “100% inviolável”. A Etapa 2 aplica defesa em profundidade e remove os riscos encontrados na auditoria atual sem apagar dados.
