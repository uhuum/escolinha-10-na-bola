import { neon } from "@neondatabase/serverless"
import * as bcrypt from "bcryptjs"

async function seedUsers() {
  if (!process.env.SUPABASE_POSTGRES_URL) {
    throw new Error("SUPABASE_POSTGRES_URL is not set")
  }

  const sql = neon(process.env.SUPABASE_POSTGRES_URL)

  try {
    // Delete existing users
    await sql`DELETE FROM public.users`

    // Generate bcrypt hashes with correct salt rounds
    const adminPasswordHash = await bcrypt.hash("jp974832", 10)
    const trainerPasswordHash = await bcrypt.hash("treinar10", 10)

    console.log("[v0] Admin hash:", adminPasswordHash)
    console.log("[v0] Trainer hash:", trainerPasswordHash)

    // Insert admin user
    await sql`
      INSERT INTO public.users (username, password_hash, role, name, created_at, updated_at)
      VALUES ('admin', ${adminPasswordHash}, 'admin', 'Administrador', NOW(), NOW())
    `

    // Insert trainer user
    await sql`
      INSERT INTO public.users (username, password_hash, role, name, created_at, updated_at)
      VALUES ('treinadores', ${trainerPasswordHash}, 'coach', 'Treinador Principal', NOW(), NOW())
    `

    // Verify inserts
    const users = await sql`SELECT id, username, role, name FROM public.users`
    console.log("[v0] Users inserted:", users)

    console.log("[v0] User seed completed successfully")
  } catch (error) {
    console.error("[v0] Error seeding users:", error)
    throw error
  }
}

seedUsers()
