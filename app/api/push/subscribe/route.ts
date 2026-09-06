import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { createServerSupabaseClient } from "@/lib/supabase/server"

export const dynamic = "force-dynamic"

type SubscriptionBody = {
  endpoint?: string
  keys?: {
    p256dh?: string
    auth?: string
  }
  action?: "subscribe" | "unsubscribe"
}

function adminClient() {
  const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) throw new Error("Configuração do Supabase indisponível")
  return createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } })
}

export async function POST(request: Request) {
  try {
    const supabase = await createServerSupabaseClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 })
    }

    const role = user.app_metadata?.role
    if (role !== "admin" && role !== "coach") {
      return NextResponse.json({ error: "Perfil inválido" }, { status: 403 })
    }

    const body = (await request.json()) as SubscriptionBody
    const endpoint = body.endpoint?.trim()
    if (!endpoint || endpoint.length > 4096 || !endpoint.startsWith("https://")) {
      return NextResponse.json({ error: "Inscrição inválida" }, { status: 400 })
    }

    const service = adminClient()

    if (body.action === "unsubscribe") {
      const { error } = await service
        .from("push_subscriptions")
        .delete()
        .eq("endpoint", endpoint)
        .eq("auth_user_id", user.id)
      if (error) throw error
      return NextResponse.json({ ok: true })
    }

    const p256dh = body.keys?.p256dh?.trim()
    const auth = body.keys?.auth?.trim()
    if (!p256dh || !auth || p256dh.length > 512 || auth.length > 512) {
      return NextResponse.json({ error: "Chaves da inscrição inválidas" }, { status: 400 })
    }

    const userAgent = request.headers.get("user-agent")?.slice(0, 500) || null
    const now = new Date().toISOString()
    const { error } = await service
      .from("push_subscriptions")
      .upsert({
        auth_user_id: user.id,
        role,
        endpoint,
        p256dh,
        auth_key: auth,
        user_agent: userAgent,
        updated_at: now,
        last_seen_at: now,
      }, { onConflict: "endpoint" })

    if (error) throw error
    return NextResponse.json({ ok: true, role })
  } catch (error) {
    console.error("[SIGA] Erro ao salvar inscrição push:", error)
    return NextResponse.json({ error: "Não foi possível ativar as notificações" }, { status: 500 })
  }
}
