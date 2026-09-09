# Sincronização da turma com chamada aberta

Chamadas do dia que estão abertas em modo de edição agora acompanham em tempo real as alterações feitas pelo administrativo nos alunos.

- aluno movido para fora da turma desaparece da lista aberta;
- aluno movido para a turma aparece automaticamente como Ausente até o treinador marcar presença;
- não é necessário fechar a edição nem atualizar a página;
- ao salvar, registros de alunos que deixaram a turma são removidos daquela chamada e novos alunos são incluídos;
- chamadas históricas continuam preservando os alunos registrados naquele dia, evitando reescrever o passado quando a turma atual muda.

A atualização utiliza o Realtime de `students` já existente no SIGA, sem polling adicional.
