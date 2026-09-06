import { createClient as createAdminClient } from "@supabase/supabase-js"
import * as bcrypt from "bcryptjs"
import { type NextRequest, NextResponse } from "next/server"
import { createServerSupabaseClient } from "@/lib/supabase/server"

type UserRole = "admin" | "coach"

type LegacyUser = {
  id: string
  username: string
  role: UserRole
  name: string
  password_hash: string
}

const internalEmail = (username: string) => `${username.trim().toLowerCase()}@siga.local`

const responseUser = (authUser: any) => ({
  id: String(authUser.user_metadata?.legacy_user_id || authUser.app_metadata?.legacy_user_id || authUser.id),
  authId: authUser.id,
  username: String(authUser.user_metadata?.username || authUser.app_metadata?.username || ""),
  role: (authUser.app_metadata?.role || "coach") as UserRole,
  name: String(authUser.user_metadata?.name || authUser.user_metadata?.username || "Usuário"),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const username = String(body?.username || "").trim().toLowerCase()
    const password = String(body?.password || "")

    if (!username || !password) {
      return NextResponse.json({ error: "Usuário e senha são obrigatórios" }, { status: 400 })
    }

    const supabase = await createServerSupabaseClient()
    const email = internalEmail(username)

    // Normal path after the account has already been migrated to Supabase Auth.
    const { data: directLogin } = await supabase.auth.signInWithPassword({ email, password })
    if (directLogin.user) {
      return NextResponse.json(responseUser(directLogin.user), {
        headers: { "Cache-Control": "private, no-store" },
      })
    }

    // Compatibility bridge: validates the existing account once, then promotes it
    // to a real Supabase Auth account without changing the user's current password.
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    if (!serviceKey || !supabaseUrl) {
      return NextResponse.json({ error: "Configuração de autenticação incompleta" }, { status: 500 })
    }

    const admin = createAdminClient(supabaseUrl, serviceKey, {
      auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
    })

    const { data: legacyUser, error: legacyError } = await admin
      .from("users")
      .select("id, username, role, name, password_hash")
      .eq("username", username)
      .maybeSingle()

    if (legacyError || !legacyUser) {
      return NextResponse.json({ error: "Credenciais inválidas" }, { status: 401 })
    }

    const validPassword = await bcrypt.compare(password, legacyUser.password_hash)
    if (!validPassword) {
      return NextResponse.json({ error: "Credenciais inválidas" }, { status: 401 })
    }

    const userMetadata = {
      username: legacyUser.username,
      name: legacyUser.name,
      legacy_user_id: legacyUser.id,
    }
    const appMetadata = {
      role: legacyUser.role,
      username: legacyUser.username,
      legacy_user_id: legacyUser.id,
    }

    const { data: usersPage, error: listError } = await admin.auth.admin.listUsers({ page: 1, perPage: 1000 })
    if (listError) {
      return NextResponse.json({ error: "Não foi possível preparar a conta" }, { status: 500 })
    }

    let authUser = usersPage.users.find((candidate) => candidate.email?.toLowerCase() === email)

    if (authUser) {
      const { data: updated, error: updateError } = await admin.auth.admin.updateUserById(authUser.id, {
        password,
        user_metadata: userMetadata,
        app_metadata: appMetadata,
      })
      if (updateError || !updated.user) {
        return NextResponse.json({ error: "Não foi possível atualizar a conta" }, { status: 500 })
      }
      authUser = updated.user
    } else {
      const { data: created, error: createError } = await admin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: userMetadata,
        app_metadata: appMetadata,
      })
      if (createError || !created.user) {
        return NextResponse.json({ error: "Não foi possível criar a sessão segura" }, { status: 500 })
      }
      authUser = created.user
    }

    const { data: migratedLogin, error: migratedLoginError } = await supabase.auth.signInWithPassword({ email, password })
    if (migratedLoginError || !migratedLogin.user) {
      return NextResponse.json({ error: "Não foi possível iniciar a sessão" }, { status: 500 })
    }

    return NextResponse.json(responseUser(migratedLogin.user), {
      headers: { "Cache-Control": "private, no-store" },
    })
  } catch (error) {
    console.error("[SIGA] Falha de autenticação:", error)
    return NextResponse.json({ error: "Erro interno de autenticação" }, { status: 500 })
  }
}
