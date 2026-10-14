import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { createServerSupabaseClient } from "@/lib/supabase/server"
import { isTrustedPushEndpoint, isValidPushKeys } from "@/lib/push/server"

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
    if (!isTrustedPushEndpoint(endpoint)) {
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
    if (!isValidPushKeys(p256dh, auth)) {
      return NextResponse.json({ error: "Chaves da inscrição inválidas" }, { status: 400 })
    }

    // Never allow one authenticated user to take ownership of another user's device.
    const { data: existing, error: ownershipError } = await service
      .from("push_subscriptions").select("auth_user_id")
      .eq("endpoint", endpoint).maybeSingle()
    if (ownershipError) throw ownershipError
    if (existing?.auth_user_id && existing.auth_user_id !== user.id) {
      return NextResponse.json({ error: "Este dispositivo pertence a outra conta. Desative e ative as notificações novamente." }, { status: 409 })
    }

    if (!existing) {
      // Prevent unbounded device registrations from one account.
      const { count, error: countError } = await service
        .from("push_subscriptions")
        .select("id", { count: "exact", head: true })
        .eq("auth_user_id", user.id)
      if (countError) throw countError
      if ((count || 0) >= 8) {
        return NextResponse.json({ error: "Limite de dispositivos atingido. Remova um aparelho antigo." }, { status: 429 })
      }
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
