import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { createServerSupabaseClient } from "@/lib/supabase/server"
import { sendEmptyWebPush } from "@/lib/push/server"

export const dynamic = "force-dynamic"

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
    if (authError || !user) return NextResponse.json({ error: "Não autenticado" }, { status: 401 })

    const role = user.app_metadata?.role
    if (role !== "admin" && role !== "coach") return NextResponse.json({ error: "Perfil inválido" }, { status: 403 })

    const { endpoint } = await request.json().catch(() => ({})) as { endpoint?: string }
    if (!endpoint || !endpoint.startsWith("https://")) {
      return NextResponse.json({ error: "Aparelho não registrado" }, { status: 400 })
    }

    const service = adminClient()
    const { data: subscription, error: subscriptionError } = await service
      .from("push_subscriptions")
      .select("id,endpoint")
      .eq("auth_user_id", user.id)
      .eq("endpoint", endpoint)
      .maybeSingle()
    if (subscriptionError) throw subscriptionError
    if (!subscription) return NextResponse.json({ error: "Aparelho não registrado" }, { status: 404 })

    const eventKey = `test-${user.id}-${Date.now()}`
    const { data: delivery, error: deliveryError } = await service
      .from("push_notification_deliveries")
      .insert({
        event_key: eventKey,
        subscription_id: subscription.id,
        auth_user_id: user.id,
        role,
        title: "SIGA — Push funcionando!",
        body: role === "admin" ? "Este aparelho receberá os avisos administrativos do SIGA." : "Este aparelho receberá os lembretes de chamada do SIGA.",
        href: role === "admin" ? "/" : "/trainer/dashboard",
      })
      .select("id")
      .single()
    if (deliveryError) throw deliveryError

    const response = await sendEmptyWebPush(subscription.endpoint)
    if (!response.ok) {
      if (response.status === 404 || response.status === 410) {
        await service.from("push_subscriptions").delete().eq("id", subscription.id)
      }
      await service.from("push_notification_deliveries").delete().eq("id", delivery.id)
      return NextResponse.json({ error: `Serviço push recusou o envio (${response.status})` }, { status: 502 })
    }

    await service.from("push_notification_deliveries").update({ sent_at: new Date().toISOString() }).eq("id", delivery.id)
    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error("[SIGA] Erro no teste de push:", error)
    return NextResponse.json({ error: "Não foi possível enviar o push de teste" }, { status: 500 })
  }
}
