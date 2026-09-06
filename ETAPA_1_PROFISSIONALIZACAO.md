# SIGA — Etapa 1 de profissionalização

## Objetivo
Melhorar desempenho e segurança sem remover dados ou funcionalidades existentes.

## Código
- Telas operacionais não baixam mais o histórico financeiro completo.
- Dashboard financeiro consulta apenas o mês selecionado.
- Financeiro limita o histórico ao período necessário.
- Lista de alunos consulta somente o mês atual para o filtro de status.
- Carômetro, chamada, aniversariantes e presenças usam thumbnails e não carregam pagamentos.
- Detalhe do aluno carrega o cadastro/histórico completo apenas quando necessário.
- Junção de pagamentos e presenças usa mapas em memória, evitando varreduras repetidas.
- Novas fotos passam a ser WebP e vão para bucket privado no Supabase Storage; a tabela guarda apenas URLs internas.
- Fotos Base64 antigas foram preservadas para garantir compatibilidade e zero perda de dados.

## Banco aplicado em produção
- Índices para pagamentos, chamadas, registros de presença e comprovantes.
- Policies RLS redundantes removidas apenas quando já havia policy mais ampla equivalente.
- search_path fixado nas funções apontadas pelo Security Advisor.
- execução pública da função SECURITY DEFINER rls_auto_enable revogada.
- bucket privado student-photos criado para novas fotos.

## Validação após migração
- students: 167
- payments: 3999
- attendance: 8
- attendance_records: 51
- receipts: 0
- Security Advisor: 0 alertas após a migração.

## Compatibilidade
A autenticação atual foi mantida nesta etapa. A migração para autenticação por sessão/roles deve ser feita separadamente para não arriscar o acesso de administradores/treinadores.
