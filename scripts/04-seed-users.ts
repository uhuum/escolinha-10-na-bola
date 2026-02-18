import { createClient } from "@supabase/supabase-js"
import * as bcrypt from "bcryptjs"

/**
 * Script to seed initial users in Supabase
 * Run with: npx ts-node scripts/04-seed-users.ts
 *
 * This script creates:
 * - Admin user: admin / jp974832
 * - Coach user: treinadores / treinar10
 */

const SUPABASE_URL = process.env.SUPABASE_URL
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY environment variables")
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

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
  console.log("Starting user seed...")

  try {
    for (const user of USERS_TO_SEED) {
      try {
        // Hash password with bcrypt
        const passwordHash = await bcrypt.hash(user.password, 10)

        // Check if user already exists
        const { data: existingUser } = await supabase.from("users").select("id").eq("username", user.username).single()

        if (existingUser) {
          console.log(`User '${user.username}' already exists. Skipping...`)
          continue
        }

        // Insert user
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
          console.error(`Error creating user '${user.username}':`, error)
        } else {
          console.log(`✓ User '${user.username}' created successfully (ID: ${data.id})`)
        }
      } catch (error) {
        console.error(`Error processing user '${user.username}':`, error)
      }
    }

    console.log("\nUser seed completed!")
  } catch (error) {
    console.error("Seed script error:", error)
    process.exit(1)
  }
}

seedUsers()
