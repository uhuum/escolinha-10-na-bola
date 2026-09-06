import { createClient } from "@supabase/supabase-js"
import * as bcrypt from "bcryptjs"

/**
 * SCRIPT PRINCIPAL: Cria tabelas + insere usuários de teste
 * Execute com: npx ts-node scripts/00-init-db.ts
 */

const SUPABASE_URL = process.env.SUPABASE_URL
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error("❌ Erro: Faltam variáveis de ambiente")
  console.error("Certifique-se de que .env.local tem:")
  console.error("  - SUPABASE_URL")
  console.error("  - SUPABASE_SERVICE_ROLE_KEY")
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

async function initDatabase() {
  console.log("\n🚀 Iniciando configuração do banco de dados...\n")

  try {
    // 1. Criar tabela users
    console.log("1️⃣  Criando tabela 'users'...")
    const { error: createTableError } = await supabase.rpc("exec_sql", {
      sql: `
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

        CREATE POLICY IF NOT EXISTS "Enable read access to users" ON public.users
          FOR SELECT
          USING (true);
      `,
    })

    if (createTableError) {
      // Se falhar com rpc, tenta execução direta via SQL editor
      console.log("⚠️  RPC não disponível, use o SQL Editor do Supabase:")
      console.log(`
      Copie e cole no Supabase > SQL Editor:
      
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
      CREATE POLICY IF NOT EXISTS "Enable read access to users" ON public.users
        FOR SELECT USING (true);
      `)
      console.log("\n✋ Após criar a tabela, execute este script novamente.\n")
      process.exit(0)
    }

    console.log("✅ Tabela 'users' criada com sucesso!\n")

    // 2. Inserir usuários de teste
    console.log("2️⃣  Inserindo usuários de teste...")

    const usersToInsert = [
      { username: "admin", password: "<senha-removida>", role: "admin", name: "Administrador" },
      { username: "treinadores", password: "<senha-removida>", role: "coach", name: "Treinador Principal" },
    ]

    for (const user of usersToInsert) {
      try {
        // Verificar se já existe
        const { data: existing } = await supabase.from("users").select("id").eq("username", user.username).single()

        if (existing) {
          console.log(`   ⊘ Usuário '${user.username}' já existe, pulando...`)
          continue
        }

        // Hash da senha
        const passwordHash = await bcrypt.hash(user.password, 10)

        // Inserir
        const { data, error } = await supabase
          .from("users")
          .insert({
            username: user.username,
            password_hash: passwordHash,
            role: user.role,
            name: user.name,
          })
          .select()
          .single()

        if (error) {
          console.error(`   ❌ Erro ao criar '${user.username}':`, error.message)
        } else {
          console.log(`   ✅ '${user.username}' criado (ID: ${data.id})`)
        }
      } catch (err) {
        console.error(`   ❌ Erro processando '${user.username}':`, err)
      }
    }

    console.log("\n✅ Setup concluído!\n")
    console.log("Credenciais de teste:")
    console.log("  Admin: admin / <senha-removida>")
    console.log("  Treinador: treinadores / <senha-removida>")
    console.log("\nVocê pode fazer login agora! 🎉\n")

    process.exit(0)
  } catch (error) {
    console.error("\n❌ Erro durante setup:", error)
    console.error("\nSe tiver erro sobre função 'exec_sql' não existir, faça manualmente:")
    console.error("1. Vá para Supabase Dashboard > SQL Editor")
    console.error("2. Cole o SQL do arquivo scripts/03-create-users-table.sql")
    console.error("3. Execute")
    console.error("4. Rode este script novamente\n")
    process.exit(1)
  }
}

initDatabase()
