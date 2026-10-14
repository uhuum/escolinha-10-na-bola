# Matrícula por link

O administrativo cria um convite individual em `/matriculas`. O responsável preenche `/matricula?convite=...`, sem login nem assinatura. Após o envio, a ficha fica pendente. O administrativo confere os dados, define categoria, dias, horários, mensalidade e vencimento, e aprova. A aprovação cadastra aluno e mensalidades em uma única transação e libera a confirmação em PDF.

## Ativação

1. Confirmar que o projeto Supabase de produção é o configurado no deploy. O repositório aponta para `giatwiftvtxqwdljfuil`; a conexão disponível durante o desenvolvimento só listava `riopklhgkqmxtfgerpzu`, que é outro projeto. Não aplicar a migração nesse projeto antigo.
2. Conferir o esquema real de `students` e `payments`, seus tipos, permissões, defaults e triggers contra a migração e o teste de banco. A verificação de integração com produção ainda está pendente por falta de acesso ao projeto correto.
3. Aplicar `supabase/migrations/20261014011127_enrollment_links.sql` no projeto correto e verificar RLS/advisors. A função é SECURITY INVOKER, exige usuário administrativo e mantém as políticas existentes de alunos e pagamentos.
4. Confirmar, sem expor seu valor, que `SUPABASE_SERVICE_ROLE_KEY` está disponível somente no servidor. O sistema já utiliza essa configuração em outras rotas. O envio público usa essa chave apenas no servidor para consumir o convite; o navegador não recebe a chave.
5. Publicar esta versão no Netlify **após a migração**. Os campos novos são usados nas consultas de alunos. Não publicar apenas o código antes de ativar o banco.
6. Testar um convite com dados fictícios, envio pelo celular, revisão, aprovação, vencimento dos pagamentos e PDF. Confirmar o bloqueio de visitantes e treinadores. Em seguida, remover os dados fictícios pelo procedimento administrativo apropriado.

## Funcionamento

- Links individuais expiram em 14 dias e aceitam um único envio. Apenas o hash do token é armazenado. O link original só aparece na criação: copiar antes de fechar.
- Links enviados não permitem recuperar dados pessoais nem editar uma ficha enviada. Para corrigir antes da aprovação, encerrar a ficha e gerar outro convite.
- Repetir o envio ou a aprovação não cria outro cadastro. A aprovação também verifica documento ou nome/data de nascimento já cadastrados.
- A mensalidade é cadastrada em reais inteiros, como o fluxo atual; zero identifica bolsista. O vencimento pode ser do dia 1 ao 28.
- São geradas mensalidades do mês atual até dezembro do próximo ano. Não há cálculo proporcional no primeiro mês. O administrativo deve conferir as condições combinadas antes de aprovar.
- Contato principal e telefone de emergência são transferidos para os dois contatos existentes do aluno. Nome/vínculo do contato de emergência e observações de saúde ficam na ficha administrativa, sem acesso pelo link público ou pelo treinador.
- O PDF da ficha aprovada representa os dados daquela aprovação. Para refletir alterações posteriores do cadastro, usar o PDF na página do aluno.
- Fichas encerradas são preservadas para consulta do administrativo; não há exclusão automática implementada. Não colocar documentos na identificação interna do convite.
- A confirmação registra a versão do aviso e a data do envio. Não há assinatura digital nem disparo automático de mensagens.

## Validação realizada

- `node --test scripts/test-enrollment.mjs`: validação de campos, CPF, datas, confirmação, configuração da turma e limites de acesso às rotas.
- `scripts/test-enrollment-database.mjs`: migração em Postgres isolado via PGlite, RLS para visitante/treinador, aprovação, datas de vencimento, repetição, duplicidade e rollback quando o financeiro falha. Executar com `PGLITE_MODULE` apontando para `@electric-sql/pglite@0.3.14` instalado fora do projeto.
- Compilação de produção concluída. O projeto possui erros de TypeScript anteriores à alteração; não foram encontrados erros nos novos módulos. A configuração existente ignora erros globais de tipos no build.
- HTTP local: formulário público 200 e sem cache; API administrativa 401 sem sessão; token inválido e Origin externo retornam 400.
- PDF de teste gerado pelo código da aplicação e renderizado para conferir a tabela, categoria e vencimento. A conferência visual no navegador e o teste com a sessão real de produção ainda são necessários na ativação.
