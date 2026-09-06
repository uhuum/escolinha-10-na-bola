import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { createServerSupabaseClient } from "@/lib/supabase/server"

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

    const body = await request.json().catch(() => ({})) as { endpoint?: string }
    const endpoint = body.endpoint?.trim()
    if (!endpoint || !endpoint.startsWith("https://")) {
      return NextResponse.json({ error: "Inscrição inválida" }, { status: 400 })
    }

    const service = adminClient()
    const { data: subscription, error: subscriptionError } = await service
      .from("push_subscriptions")
      .select("id")
      .eq("endpoint", endpoint)
      .eq("auth_user_id", user.id)
      .maybeSingle()

    if (subscriptionError) throw subscriptionError
    if (!subscription) return NextResponse.json({ notification: null })

    const { data: delivery, error: deliveryError } = await service
      .from("push_notification_deliveries")
      .select("id,event_key,title,body,href")
      .eq("subscription_id", subscription.id)
      .is("claimed_at", null)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle()

    if (deliveryError) throw deliveryError
    if (!delivery) return NextResponse.json({ notification: null })

    const claimedAt = new Date().toISOString()
    const { error: claimError } = await service
      .from("push_notification_deliveries")
      .update({ claimed_at: claimedAt })
      .eq("subscription_id", subscription.id)
      .is("claimed_at", null)
      .lte("created_at", claimedAt)

    if (claimError) throw claimError

    return NextResponse.json({
      notification: {
        id: delivery.event_key,
        title: delivery.title,
        body: delivery.body,
        href: delivery.href,
      },
    }, {
      headers: { "Cache-Control": "private, no-store, max-age=0" },
    })
  } catch (error) {
    console.error("[SIGA] Erro ao buscar push pendente:", error)
    return NextResponse.json({ notification: null }, { status: 500 })
  }
}
