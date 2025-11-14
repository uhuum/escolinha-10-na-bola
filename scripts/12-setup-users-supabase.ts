import { createClient } from "@supabase/supabase-js"
import * as bcrypt from "bcryptjs"

// Initialize Supabase client with service role key
const supabase = createClient(process.env.SUPABASE_URL || "", process.env.SUPABASE_SERVICE_ROLE_KEY || "")

async function setupUsers() {
  try {
    console.log("[v0] Starting user setup with Supabase...")

    // Delete existing users
    const { error: deleteError } = await supabase
      .from("users")
      .delete()
      .neq("id", "00000000-0000-0000-0000-000000000000")

    if (deleteError && deleteError.code !== "PGRST116") {
      console.error("[v0] Error deleting users:", deleteError)
    }

    // Generate bcrypt hashes
    const adminPasswordHash = await bcrypt.hash("jp974832", 10)
    const coachPasswordHash = await bcrypt.hash("treinar10", 10)

    console.log("[v0] Generated password hashes")
    console.log("[v0] Admin hash:", adminPasswordHash)
    console.log("[v0] Coach hash:", coachPasswordHash)

    // Insert admin user
    const { data: adminData, error: adminError } = await supabase.from("users").insert([
      {
        username: "admin",
        password_hash: adminPasswordHash,
        role: "admin",
        name: "Administrador",
      },
    ])

    if (adminError) {
      console.error("[v0] Error inserting admin:", adminError)
      throw adminError
    }

    console.log("[v0] Admin user inserted successfully")

    // Insert coach user
    const { data: coachData, error: coachError } = await supabase.from("users").insert([
      {
        username: "treinadores",
        password_hash: coachPasswordHash,
        role: "coach",
        name: "Treinadores",
      },
    ])

    if (coachError) {
      console.error("[v0] Error inserting coach:", coachError)
      throw coachError
    }

    console.log("[v0] Coach user inserted successfully")

    // Verify users were inserted
    const { data: users, error: selectError } = await supabase
      .from("users")
      .select("username, role, name")
      .order("created_at", { ascending: true })

    if (selectError) {
      console.error("[v0] Error verifying users:", selectError)
      throw selectError
    }

    console.log("[v0] Users in database:", users)
    console.log("[v0] User setup complete!")
  } catch (error) {
    console.error("[v0] Setup failed:", error)
    process.exit(1)
  }
}

setupUsers()
