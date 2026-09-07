# SIGA — Sincronização global em tempo real

Implementado em 07/09/2026.

## O que sincroniza
- Alunos: cadastro, edição, arquivamento/restauração e alterações de turma/dados.
- Pagamentos: baixa, reversão, status, valor, adiamento, comprovante e demais alterações.
- Chamadas: criação e exclusão de chamada.
- Presenças: edição dos status dos alunos dentro de uma chamada.
- Telas derivadas (dashboard, financeiro, listas, carômetro e relatórios) recebem os novos dados por meio dos hooks que já alimentam essas telas.

## Entre aparelhos
O navegador assina alterações PostgreSQL pelo Supabase Realtime. Uma alteração feita em celular, computador ou tablet dispara atualização nas telas abertas relevantes, sem F5.

## Reconexão
Um aparelho offline não pode receber eventos enquanto está sem rede. Ao voltar a ficar online, ao retornar de suspensão/segundo plano ou ao restaurar a página pelo cache do navegador, o SIGA reconcilia os dados com o banco automaticamente.

## Proteção de desempenho
- Eventos são agrupados com debounce para evitar várias recargas em operações em lote.
- Cada tela recarrega apenas o conjunto/período que ela já utiliza.
- BroadcastChannel continua sincronizando abas do mesmo aparelho.
- Não há polling contínuo.

## Banco
`attendance` e `attendance_records` foram adicionadas à publicação `supabase_realtime`. `students` e `payments` já estavam habilitadas.
