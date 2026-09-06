# SIGA — Etapa 2: autenticação e segurança

## O que mudou

- A sessão deixou de depender de `localStorage` como fonte de autenticação.
- O login passa a usar Supabase Auth com sessão em cookies.
- O sistema valida a sessão real do usuário ao abrir/recarregar.
- O proxy do Next.js mantém os tokens de autenticação atualizados.
- O logout encerra a sessão no Supabase Auth e no navegador.
- Os usuários atuais são migrados automaticamente no primeiro login, mantendo o usuário e a senha que já utilizam.
- O ID antigo do usuário é preservado nos metadados para manter compatibilidade com registros de frequência já existentes.
- Foi preparada uma migração RLS para remover acesso anônimo às tabelas do sistema.
- Financeiro/comprovantes ficam restritos ao perfil administrador no banco.
- Frequência e leitura dos alunos continuam disponíveis ao treinador autenticado.

## Ordem segura de implantação

1. Publicar primeiro este código no Netlify.
2. Testar login de Administrador e Treinador.
3. Aplicar `supabase/migrations/20260906_stage2_supabase_auth_rls.sql`.
4. Testar novamente login, alunos, mensalidades e chamada.

Não aplicar a migração RLS antes de publicar o novo código, pois a versão anterior ainda depende de acesso anônimo do navegador.
