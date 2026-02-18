import { createClient } from "@supabase/supabase-js"
import * as bcrypt from "bcryptjs"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY")
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function seedUsers() {
  try {
    console.log("[v0] Starting user seed with Supabase...")

    // Clear existing users
    const { error: deleteError } = await supabase
      .from("users")
      .delete()
      .neq("id", "00000000-0000-0000-0000-000000000000")

    if (deleteError) {
      console.log("[v0] Note: Could not clear existing users (may not exist yet):", deleteError.message)
    }

    // Generate bcrypt hashes for passwords
    const adminPassword = "jp974832"
    const trainerPassword = "treinar10"

    console.log("[v0] Generating password hashes...")
    const adminHash = await bcrypt.hash(adminPassword, 10)
    const trainerHash = await bcrypt.hash(trainerPassword, 10)

    // Insert users
    const users = [
      {
        username: "admin",
        password_hash: adminHash,
        role: "admin",
        name: "Administrator",
      },
      {
        username: "treinadores",
        password_hash: trainerHash,
        role: "coach",
        name: "Treinadores",
      },
    ]

    console.log("[v0] Inserting users into database...")
    const { data, error } = await supabase.from("users").insert(users).select()

    if (error) {
      console.error("[v0] Error inserting users:", error.message)
      process.exit(1)
    }

    console.log("[v0] Successfully seeded users:")
    data?.forEach((user) => {
      console.log(`  - ${user.username} (${user.role})`)
    })

    console.log("[v0] User seed completed successfully!")
    process.exit(0)
  } catch (error) {
    console.error("[v0] Unexpected error:", error)
    process.exit(1)
  }
}

seedUsers()
