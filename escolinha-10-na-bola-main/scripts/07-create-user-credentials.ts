import * as bcrypt from "bcryptjs"

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error("[v0] Variáveis de ambiente faltando")
  console.error("NEXT_PUBLIC_SUPABASE_URL:", SUPABASE_URL ? "✓" : "✗")
  console.error("SUPABASE_SERVICE_ROLE_KEY:", SUPABASE_SERVICE_KEY ? "✓" : "✗")
  throw new Error("Credenciais Supabase faltando")
}

const USERS_TO_CREATE = [
  {
    username: "admin",
    password: "jp974832",
    role: "admin",
    name: "Administrador",
  },
  {
    username: "treinadores",
    password: "treinar10",
    role: "coach",
    name: "Treinador Principal",
  },
]

async function createUsers() {
  console.log("[v0] Iniciando criação de usuários...")
  console.log("[v0] URL Supabase:", SUPABASE_URL)

  try {
    for (const user of USERS_TO_CREATE) {
      console.log(`[v0] Processando usuário: ${user.username}`)

      // Gerar hash da senha com bcrypt
      const passwordHash = await bcrypt.hash(user.password, 10)
      console.log(`[v0] Senha criptografada para ${user.username}`)

      // Verificar se o usuário já existe
      const checkResponse = await fetch(`${SUPABASE_URL}/rest/v1/users?username=eq.${user.username}&select=id`, {
        headers: {
          apikey: SUPABASE_SERVICE_KEY,
          Authorization: `Bearer ${SUPABASE_SERVICE_KEY}`,
          "Content-Type": "application/json",
        },
      })

      const existingUsers = await checkResponse.json()

      if (existingUsers && existingUsers.length > 0) {
        console.log(`[v0] ⚠️ Usuário '${user.username}' já existe. Pulando...`)
        continue
      }

      // Inserir novo usuário
      const insertResponse = await fetch(`${SUPABASE_URL}/rest/v1/users`, {
        method: "POST",
        headers: {
          apikey: SUPABASE_SERVICE_KEY,
          Authorization: `Bearer ${SUPABASE_SERVICE_KEY}`,
          "Content-Type": "application/json",
          Prefer: "return=representation",
        },
        body: JSON.stringify({
          username: user.username,
          password_hash: passwordHash,
          role: user.role,
          name: user.name,
        }),
      })

      if (!insertResponse.ok) {
        const errorText = await insertResponse.text()
        console.error(`[v0] ❌ Erro ao criar usuário '${user.username}':`, errorText)
      } else {
        const data = await insertResponse.json()
        console.log(`[v0] ✅ Usuário '${user.username}' criado com sucesso!`)
        console.log(`[v0]    ID: ${data[0]?.id}`)
        console.log(`[v0]    Role: ${user.role}`)
        console.log(`[v0]    Nome: ${user.name}`)
      }
    }

    console.log("\n[v0] ==========================================")
    console.log("[v0] Criação de usuários concluída!")
    console.log("[v0] ==========================================")
    console.log("[v0] Credenciais de acesso:")
    console.log("[v0] ")
    console.log("[v0] TREINADORES:")
    console.log("[v0]   Usuário: treinadores")
    console.log("[v0]   Senha: treinar10")
    console.log("[v0] ")
    console.log("[v0] ADMIN:")
    console.log("[v0]   Usuário: admin")
    console.log("[v0]   Senha: jp974832")
    console.log("[v0] ==========================================")
  } catch (error) {
    console.error("[v0] Erro no script:", error)
    throw error
  }
}

createUsers()
