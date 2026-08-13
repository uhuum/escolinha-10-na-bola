import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"
import * as bcrypt from "bcryptjs"
import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const { username, password } = await request.json()

    if (!username || !password) {
      return NextResponse.json({ error: "Username and password required" }, { status: 400 })
    }

    console.log("[v0] Login attempt for user:", username)

    // Create Supabase server client with SERVICE ROLE KEY to bypass RLS
    const cookieStore = await cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL || "",
      process.env.SUPABASE_SERVICE_ROLE_KEY || "",
      {
        cookies: {
          getAll() {
            return cookieStore.getAll()
          },
          setAll(cookies) {
            cookies.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options)
            })
          },
        },
      },
    )

    // Query users table
    const { data: user, error } = await supabase
      .from("users")
      .select("id, username, role, name, password_hash")
      .eq("username", username)
      .maybeSingle()

    if (error) {
      console.error("[v0] Supabase query error:", error.message)
      return NextResponse.json({ error: "Database error" }, { status: 500 })
    }

    if (!user) {
      console.log("[v0] User not found:", username)
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 })
    }

    console.log("[v0] User found, verifying password...")

    // Verify password with bcrypt
    const isValidPassword = await bcrypt.compare(password, user.password_hash)

    if (!isValidPassword) {
      console.log("[v0] Password verification failed for user:", username)
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 })
    }

    console.log("[v0] Login successful for user:", username)

    // Return user data (without password hash)
    return NextResponse.json({
      id: user.id,
      username: user.username,
      role: user.role,
      name: user.name,
    })
  } catch (error) {
    console.error("[v0] Login error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
