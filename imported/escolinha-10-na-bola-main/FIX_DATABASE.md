# Corrigir Erro de Foreign Key

O erro ocorreu porque o script SQL tentava criar uma constraint de foreign key para tabelas que não existem ainda.

## Solução Rápida (Faça Agora)

### 1. Copie todo o SQL abaixo:

\`\`\`sql
CREATE TABLE IF NOT EXISTS public.users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  username VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role VARCHAR(50) NOT NULL CHECK (role IN ('admin', 'coach')),
  name VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_users_username ON public.users(username);
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable read access to users" ON public.users
  FOR SELECT
  USING (true);

CREATE TABLE IF NOT EXISTS public.receipts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id UUID,
  file_path VARCHAR(500) NOT NULL,
  file_url VARCHAR(500) NOT NULL,
  file_name VARCHAR(255) NOT NULL,
  payment_id UUID,
  uploaded_at TIMESTAMP DEFAULT NOW(),
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_receipts_student_id ON public.receipts(student_id);
CREATE INDEX IF NOT EXISTS idx_receipts_payment_id ON public.receipts(payment_id);

ALTER TABLE public.receipts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable read receipts" ON public.receipts
  FOR SELECT
  USING (true);

CREATE POLICY "Enable insert receipts" ON public.receipts
  FOR INSERT
  WITH CHECK (true);
\`\`\`

### 2. Vá para Supabase Dashboard

- **Projeto > SQL Editor > New Query**

### 3. Cole o SQL e clique "Run"

### 4. Depois execute o script Node:

\`\`\`bash
npm run db:init
\`\`\`

## Por que removemos Foreign Keys?

- As tabelas \`students\` e \`payments\` já existem no seu banco
- Quando o script tenta criar \`receipts\` com FK para \`students\`, a ordem importa
- Removemos as FKs por enquanto - podem ser adicionadas depois se necessário

## Teste Rápido

Após executar o SQL:

\`\`\`bash
npm run dev
\`\`\`

Acesse **http://localhost:3000/login**

**Credenciais:**
- Admin: \`admin\` / \`jp974832\`
- Treinador: \`treinadores\` / \`treinar10\`

Se funcionar, a splash screen profissional aparecerá! 🎉
`
