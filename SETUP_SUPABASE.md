# 🔧 Configuração do Supabase

Para sincronizar a página de pagamentos com seu banco de dados, você precisa configurar as variáveis de ambiente do Supabase.

## Passo 1: Obter as Credenciais do Supabase

1. Acesse [Supabase Dashboard](https://app.supabase.com)
2. Selecione seu projeto
3. Vá para **Settings → API** 
4. Copie:
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **Anon Public Key** → `NEXT_PUBLIC_SUPABASE_ANON_KEY`

## Passo 2: Adicionar as Variáveis de Ambiente

### No Netlify (Produção):
1. Vá para seu projeto no Netlify
2. **Settings → Environment Variables**
3. Adicione:
   - Nome: `NEXT_PUBLIC_SUPABASE_URL`
   - Valor: sua URL do Supabase
4. Repita para `NEXT_PUBLIC_SUPABASE_ANON_KEY`

### Localmente (Desenvolvimento):
Crie um arquivo `.env.local` na raiz do projeto:

```env
NEXT_PUBLIC_SUPABASE_URL=sua_url_aqui
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua_chave_aqui
```

## Passo 3: Verificar a Sincronização

Após adicionar as variáveis:
1. Faça deploy (ou reinicie o servidor local)
2. Abra a página `/payments`
3. Os alunos e pagamentos do seu banco de dados Supabase aparecerão automaticamente

## O que Será Sincronizado

- ✅ Lista de alunos (tabela `students`)
- ✅ Histórico de pagamentos (tabela `payments`)
- ✅ Status de pagamento em tempo real
- ✅ Comprovantes de pagamento
- ✅ Dados de matriculação e bolsas

## Suporte

Se houver problemas:
1. Verifique se as variáveis estão corretas (sem espaços extras)
2. Confirme que o Supabase está ativo e as credenciais são válidas
3. Verifique as políticas de segurança (RLS) no Supabase
