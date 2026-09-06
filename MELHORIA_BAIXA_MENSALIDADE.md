# Melhoria da baixa de mensalidade

- A tela "Dando baixa" agora acompanha a resposta real do Supabase.
- O estado de sucesso só aparece depois da confirmação do banco.
- Em caso de erro, a interface não mostra falso sucesso e permite fechar o aviso.
- Cliques repetidos durante a operação são bloqueados.
- O tipo de pagamento escolhido (PIX ou dinheiro) é persistido corretamente.
- A atualização continua local, sem recarregar toda a lista de alunos/pagamentos.
