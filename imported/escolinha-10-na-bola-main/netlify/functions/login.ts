import { createClient } from "@supabase/supabase-js"
import * as bcrypt from "bcryptjs"

// Netlify serverless function for authentication
export default async (req: any) => {
  if (req.method !== "POST") {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: "Method not allowed" }),
    }
  }

  try {
    const { username, password } = JSON.parse(req.body)

    if (!username || !password) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "Username and password required" }),
      }
    }

    // Initialize Supabase with service role key (server-side only)
    const supabase = createClient(process.env.SUPABASE_URL || "", process.env.SUPABASE_SERVICE_ROLE_KEY || "")

    // Query users table
    const { data: user, error } = await supabase
      .from("users")
      .select("id, username, role, name, password_hash")
      .eq("username", username)
      .single()

    if (error || !user) {
      console.error("[v0] User not found:", error)
      return {
        statusCode: 401,
        body: JSON.stringify({ error: "Invalid credentials" }),
      }
    }

    // Verify password with bcrypt
    const isValidPassword = await bcrypt.compare(password, user.password_hash)

    if (!isValidPassword) {
      return {
        statusCode: 401,
        body: JSON.stringify({ error: "Invalid credentials" }),
      }
    }

    // Return user data (without password hash)
    return {
      statusCode: 200,
      body: JSON.stringify({
        id: user.id,
        username: user.username,
        role: user.role,
        name: user.name,
      }),
    }
  } catch (error) {
    console.error("[v0] Login error:", error)
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Internal server error" }),
    }
  }
}
