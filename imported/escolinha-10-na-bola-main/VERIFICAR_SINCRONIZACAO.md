# ✅ Verificar Sincronização com Supabase

## Como saber se está sincronizado?

### 1. Verificar no Console do Navegador
Abra o DevTools (F12) e veja o console:
- **✅ Sincronizado**: Você verá a mensagem `[v0] ✅ Supabase sincronizado - Alunos carregados: XX`
- **❌ Não sincronizado**: Verá erro sobre variáveis de ambiente faltando

### 2. Verificar os Dados
Na página `/payments`:
- **✅ Sincronizado**: 
  - Aparece lista de alunos de janeiro/2026 em diante
  - Dados mudam quando você edita no Supabase
  - Histórico de pagamentos mostra os registros do banco
  
- **❌ Não sincronizado**:
  - Exibe mensagem "Configuration Required"
  - Nenhum aluno aparece
  - Não é possível editar informações

## Dados que Sincronizam Automaticamente

### Tabela `students`
- Nome do aluno
- RG, data de nascimento
- Responsável e dados de contato
- Valor mensal
- Horário e dias de aula
- Status ativo/inativo
- Bolsa (scholarship)

### Tabela `payments`
- Status do pagamento (Pago, Em Aberto, etc)
- Valor cobrado
- Data de pagamento
- Comprovantes (receipts)
- Histórico completo

## Se Não Estiver Sincronizando

1. **Verifique as variáveis de ambiente**:
   ```bash
   # Verifique se estas variáveis estão definidas:
   echo $NEXT_PUBLIC_SUPABASE_URL
   echo $NEXT_PUBLIC_SUPABASE_ANON_KEY
   ```

2. **Reinicie o servidor**:
   - Se local: `Ctrl+C` e execute novamente
   - Se Vercel: Espere o redeploy ou force um novo

3. **Limpe o cache do navegador**:
   - F12 → Application → Clear Storage → Clear Site Data

4. **Verifique as credenciais do Supabase**:
   - Acesse Supabase Dashboard → Settings → API
   - Confirme que as keys ainda são válidas

## Monitorar em Tempo Real

No console do navegador, você pode ver:
```javascript
// Ver estudiantes carregados
console.log(window.__STUDENTS__)

// Verificar sincronização
localStorage.getItem('supabase.auth.token')
```

## Problemas Comuns

| Problema | Solução |
|----------|---------|
| "Configuration Required" | Adicione as variáveis de ambiente |
| Alunos desaparecem | Verifique RLS policies no Supabase |
| Dados não atualizam | Verifique conexão com Supabase |
| Erro 403 | Verifique permissões no Supabase Auth |

## Mais Informações

Veja `/SETUP_SUPABASE.md` para instruções completas de configuração.
