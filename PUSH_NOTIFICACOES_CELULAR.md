# SIGA — Push no celular

Implementação da Etapa 3 para notificações reais via Web Push.

## O que foi implementado

- Push real no celular, mesmo com o SIGA fechado, quando o navegador/sistema operacional permitir.
- Vibração solicitada no Android por meio da opção `vibrate` da Notification API. O sistema operacional continua tendo a decisão final conforme modo silencioso, foco e permissões do aparelho.
- Clique na notificação abre diretamente a área correta do SIGA.
- Admin e Treinador são separados pelo papel autenticado do Supabase Auth.
- O mesmo lembrete não é enviado duas vezes ao mesmo aparelho, graças à chave idempotente no banco.
- Inscrições expiradas são removidas automaticamente.
- O lembrete de chamada não é enviado se a chamada daquele horário já estiver registrada.
- Horário calculado em `America/Sao_Paulo`.
- Scheduler Netlify roda a cada 10 minutos e decide se existe algum evento devido.

## Horários

### Admin
- Dia 01, a partir das 08:00: abertura das mensalidades do novo mês.
- Dia 10, a partir das 08:00: lembrete de vencimento.
- Último dia do mês, a partir das 18:00: resumo com pendências e quantidade de alunos novos.

### Treinadores
- Segunda a sexta, 18:00: 1º horário, somente se ainda não houver chamada `18:00-19:30` no dia.
- Segunda a sexta, 19:40: 2º horário, somente se ainda não houver chamada `19:30-21:00` no dia.

## Banco de dados

A migration `20260906_stage3_push_notifications.sql` cria:
- `push_subscriptions`
- `push_notification_deliveries`

As duas tabelas têm RLS habilitado e nenhum acesso direto de `anon`/`authenticated`; leitura e escrita são feitas apenas por rotas autenticadas do servidor e pelo `service_role`.

A migration já foi aplicada ao projeto de produção em 06/09/2026.

## Configuração obrigatória no Netlify

No computador, dentro do projeto, execute uma única vez:

```powershell
npm run push:keys
```

O comando imprime três variáveis:
- `NEXT_PUBLIC_VAPID_PUBLIC_KEY`
- `VAPID_PRIVATE_KEY`
- `VAPID_SUBJECT`

Adicione as três em **Netlify → Site configuration → Environment variables**. A chave privada nunca deve ser enviada em chat, commit ou screenshot.

Depois faça um novo deploy para que `NEXT_PUBLIC_VAPID_PUBLIC_KEY` seja incorporada ao front-end.

## Ativação no aparelho

O usuário toca no sino e depois em **Ativar**. O navegador pede permissão. A inscrição fica vinculada ao usuário autenticado e ao papel (`admin` ou `coach`).

### iPhone / iPad

Web Push funciona para web apps adicionados à Tela de Início. Adicione o SIGA à Tela de Início, abra pelo ícone e então toque em **Ativar**. A permissão precisa ser solicitada a partir desse toque do usuário.

### Android / desktop

Navegadores compatíveis podem ativar diretamente pelo botão **Ativar**.

## Observação sobre vibração/som

O SIGA solicita vibração no push. Som, vibração, tela bloqueada e banners são controlados também pelo sistema operacional. Se o aparelho estiver em silencioso, Foco/Não Perturbe, economia agressiva ou com notificações bloqueadas, o sistema operacional pode suprimir som/vibração mesmo que o push tenha sido entregue.

## Teste recomendado após deploy

1. Entrar como Admin e ativar push no aparelho.
2. Entrar como Treinador em outro aparelho e ativar push.
3. Confirmar no Supabase que existem linhas em `push_subscriptions` com os papéis corretos.
4. Testar um envio controlado antes de esperar o próximo horário real.
5. Confirmar que clicar no push abre a rota correta.
6. Confirmar que uma chamada já feita impede o lembrete daquele horário.
