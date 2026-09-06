import { NextResponse } from "next/server"
import { createServerSupabaseClient } from "@/lib/supabase/server"

type UserRole = "admin" | "coach"

const internalEmail = (username: string) => `${username.trim().toLowerCase()}@siga.local`

const responseUser = (authUser: any) => ({
  id: String(authUser.user_metadata?.legacy_user_id || authUser.app_metadata?.legacy_user_id || authUser.id),
  authId: authUser.id,
  username: String(authUser.user_metadata?.username || authUser.app_metadata?.username || ""),
  role: authUser.app_metadata?.role as UserRole,
  name: String(authUser.user_metadata?.name || authUser.user_metadata?.username || "Usuário"),
})

function noStoreJson(body: unknown, status = 200) {
  return NextResponse.json(body, {
    status,
    headers: {
      "Cache-Control": "private, no-store, max-age=0, must-revalidate",
      Pragma: "no-cache",
    },
  })
}

export async function POST(request: Request) {
  try {
    const contentType = request.headers.get("content-type") || ""
    if (!contentType.toLowerCase().includes("application/json")) {
      return noStoreJson({ error: "Requisição inválida" }, 415)
    }

    const body = await request.json()
    const username = String(body?.username || "").trim().toLowerCase()
    const password = String(body?.password || "")

    // Keep the public endpoint deliberately strict and return the same message
    // for malformed and invalid credentials to avoid account enumeration.
    if (!/^[a-z0-9._-]{1,64}$/.test(username) || password.length < 1 || password.length > 256) {
      return noStoreJson({ error: "Credenciais inválidas" }, 401)
    }

    const supabase = await createServerSupabaseClient()
    const { data, error } = await supabase.auth.signInWithPassword({
      email: internalEmail(username),
      password,
    })

    const authUser = data.user
    const role = authUser?.app_metadata?.role as UserRole | undefined
    const storedUsername = String(authUser?.user_metadata?.username || authUser?.app_metadata?.username || "")

    if (error || !authUser || !storedUsername || (role !== "admin" && role !== "coach")) {
      if (authUser) await supabase.auth.signOut()
      return noStoreJson({ error: "Credenciais inválidas" }, 401)
    }

    return noStoreJson(responseUser(authUser))
  } catch (error) {
    console.error("[SIGA] Falha de autenticação:", error)
    return noStoreJson({ error: "Não foi possível entrar" }, 500)
  }
}
