# Notificação de mensalidade adiada

- No dia definido em `postponed_to`, o administrativo recebe uma notificação interna no SIGA.
- O push também é enviado aos aparelhos do perfil administrativo com push ativado.
- A notificação mostra o nome completo do aluno e o nome do responsável cadastrado.
- Cada mensalidade gera no máximo um push por aparelho naquele dia.
- Se a mensalidade for paga antes da data combinada, deixa de ter status `Adiado` e não gera o aviso.
- A verificação usa o fuso `America/Sao_Paulo`.
