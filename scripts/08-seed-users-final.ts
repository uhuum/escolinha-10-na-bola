import * as bcrypt from "bcryptjs"

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error("[v0] Missing environment variables")
  console.error("NEXT_PUBLIC_SUPABASE_URL:", SUPABASE_URL ? "✓" : "✗")
  console.error("SUPABASE_SERVICE_ROLE_KEY:", SUPABASE_SERVICE_KEY ? "✓" : "✗")
  throw new Error("Missing Supabase credentials")
}

const USERS_TO_SEED = [
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

async function seedUsers() {
  console.log("[v0] Starting user seed...")

  try {
    for (const user of USERS_TO_SEED) {
      console.log(`[v0] Processing user: ${user.username}`)

      // Hash password with bcrypt
      const passwordHash = await bcrypt.hash(user.password, 10)
      console.log(`[v0] Password hashed for ${user.username}`)

      // Check if user already exists
      const checkResponse = await fetch(`${SUPABASE_URL}/rest/v1/users?username=eq.${user.username}&select=id`, {
        headers: {
          apikey: SUPABASE_SERVICE_KEY,
          Authorization: `Bearer ${SUPABASE_SERVICE_KEY}`,
          "Content-Type": "application/json",
        },
      })

      const existingUsers = await checkResponse.json()

      if (existingUsers && existingUsers.length > 0) {
        console.log(`[v0] User '${user.username}' already exists. Skipping...`)
        continue
      }

      // Insert user
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
        console.error(`[v0] Error creating user '${user.username}':`, errorText)
      } else {
        const data = await insertResponse.json()
        console.log(`[v0] User '${user.username}' created successfully (ID: ${data[0]?.id})`)
      }
    }

    console.log("[v0] User seed completed!")
    console.log("[v0] Login credentials:")
    console.log("[v0] Admin - username: admin, password: jp974832")
    console.log("[v0] Treinadores - username: treinadores, password: treinar10")
  } catch (error) {
    console.error("[v0] Seed script error:", error)
    throw error
  }
}

seedUsers()
