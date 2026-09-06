# Login e acompanhamento de frequência

## Login sem retorno visual para a tela de acesso
- A sessão é salva assim que a API confirma o usuário.
- A rota do painel é pre-carregada e aberta com `router.replace`.
- A tela de login deixa de ser renderizada assim que existe um usuário autenticado.
- A transição de entrada ficou mais curta e cobre todo o período de navegação.

## Carregamentos
- Tela de carregamento com prioridade visual acima do cabeçalho.
- Mensagens mais objetivas e transição de login mais rápida.

## Frequência / risco de afastamento
Foi criado o componente `AttendanceFollowUp` para administrador e treinador.
Ele usa os registros existentes de chamada, sem alterar os dados históricos.

Critérios atuais:
- Atenção: 2 faltas consecutivas ou frequência <= 65% nas últimas chamadas.
- Urgente: 3+ faltas consecutivas ou frequência <= 50% nas últimas chamadas.
- Mostra quantidade de faltas, taxa recente e data da última chamada.
- Atalho para WhatsApp e telefone do responsável quando disponíveis.

## Velocidade da chamada
Após registrar ou editar uma chamada, a tela atualiza apenas o registro alterado em memória.
Não é mais necessário baixar novamente todo o histórico de presenças após cada ação.
