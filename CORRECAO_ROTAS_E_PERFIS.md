# Correção de rotas e perfis

Esta correção centraliza a autorização de rotas do SIGA para impedir mistura entre telas de Administrativo e Treinadores.

## Regras

- Usuário não autenticado: somente `/login`.
- Administrativo: rotas administrativas; qualquer `/trainer/...` redireciona para `/`.
- Treinador: somente `/trainer/...`; qualquer rota administrativa redireciona para `/trainer/dashboard`.
- A regra vale para link, URL digitada, refresh, favoritos e histórico Voltar/Avançar.
- Rotas de API não recebem redirecionamento HTML; cada API continua responsável pela sua autorização.

## Proteções aplicadas

1. Proteção no `proxy.ts` antes da renderização.
2. Proteção duplicada no `AuthProvider` no navegador.
3. Revalidação de sessão ao restaurar páginas pelo bfcache do navegador.
4. Cabeçalhos `no-store` nas páginas protegidas.
5. Footer com links específicos por perfil.
6. Política de rotas centralizada em `lib/auth/route-policy.ts` para evitar regras divergentes.

## Segurança de rota
A política central de rotas é aplicada no Proxy antes da renderização e revalidada no navegador após restauração de histórico. O banco continua sendo a autoridade final por meio de RLS.
