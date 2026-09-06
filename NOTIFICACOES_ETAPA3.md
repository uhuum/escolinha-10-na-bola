# Etapa 3 — Central de notificações

Implementação inicial da central de notificações do SIGA, separada por perfil.

## Administrativo

- Dia 01: aviso de início do mês para envio da cobrança nos grupos.
- Dia 10: aviso de vencimento das mensalidades.
- Último dia do mês: resumo automático com quantidade de pendências e quantidade de alunos novos.
- O resumo do fechamento também lista os nomes dos alunos novos cadastrados no mês.

## Treinadores

De segunda a sexta:

- 18:00: lembrete da chamada do primeiro horário (18:00–19:30).
- 19:40: lembrete da chamada do segundo horário (19:30–21:00).
- Se a chamada daquele horário já tiver sido registrada, o lembrete deixa de aparecer.

## Separação por perfil

- Admin não recebe lembretes dos treinadores.
- Treinadores não recebem avisos financeiros/administrativos.

## Interface

- Sino de notificações no cabeçalho.
- Contador de notificações não lidas.
- Notificações em popover responsivo para desktop e celular.
- Marcar uma ou todas como lidas.
- Aviso visual (toast) quando uma nova notificação ativa é encontrada.
- Botão em cada aviso leva diretamente à tela relacionada.

As notificações são calculadas com o fuso `America/Sao_Paulo` e o estado de leitura é guardado por usuário no navegador. Nenhuma informação de autenticação é armazenada nesse mecanismo.

## Push no celular

A etapa foi ampliada com Web Push real:

- o usuário pode ativar o aparelho pelo próprio sino;
- o push pode chegar com o SIGA fechado;
- existe botão de teste imediato;
- o clique abre a rota correta;
- no iPhone/iPad, o SIGA orienta a instalação na Tela de Início antes de solicitar a permissão;
- o servidor mantém Admin e Treinador separados pelo papel autenticado;
- os disparos automáticos usam Netlify Scheduled Functions e chaves VAPID;
- detalhes de instalação e configuração estão em `PUSH_NOTIFICACOES_CELULAR.md`.

## Novos alunos no Dashboard Administrativo

O Dashboard Financeiro agora mostra um bloco **Novos alunos do mês**, integrado ao seletor de mês/ano já existente. O card calcula automaticamente os cadastros a partir de `registration_date` (com o fallback já existente para `created_at`), exibe a quantidade, o nome de cada aluno e a data de entrada. Cada item abre o perfil do aluno. O mesmo critério de mês/ano continua sendo usado no resumo da notificação administrativa do último dia do mês.
