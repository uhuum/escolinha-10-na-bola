import { createClient } from "@supabase/supabase-js"
import { sendEmptyWebPush } from "../../lib/push/server"

type Subscription = { id:string; auth_user_id:string; role:"admin"|"coach"; endpoint:string }

export default async (req: Request) => {
  try {
    const { payload } = await req.json() as { payload?: { id?:string; context?:string; branch?:string } }
    if (!payload?.id) return new Response("ignored", { status: 200 })
    if (payload.context && payload.context !== "production") return new Response("non-production ignored", { status: 200 })

    const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY
    if (!url || !key) throw new Error("Supabase não configurado")

    const supabase = createClient(url, key, { auth: { persistSession:false, autoRefreshToken:false } })
    const { data, error } = await supabase.from("push_subscriptions").select("id,auth_user_id,role,endpoint")
    if (error) throw error

    let sent=0, skipped=0, expired=0
    for (const subscription of (data || []) as Subscription[]) {
      const eventKey = `system-update-${payload.id}`
      const { data: delivery, error: deliveryError } = await supabase
        .from("push_notification_deliveries")
        .insert({
          event_key:eventKey,
          subscription_id:subscription.id,
          auth_user_id:subscription.auth_user_id,
          role:subscription.role,
          title:"SIGA — Sistema atualizado!",
          body:"Uma nova versão do sistema acabou de ser publicada. Toque para conferir agora.",
          href:subscription.role === "coach" ? "/trainer/dashboard" : "/",
        })
        .select("id")
        .maybeSingle()

      if (deliveryError) {
        if ((deliveryError as any).code === "23505") { skipped++; continue }
        throw deliveryError
      }
      if (!delivery) continue

      try {
        const response = await sendEmptyWebPush(subscription.endpoint)
        if (response.ok) {
          sent++
          await supabase.from("push_notification_deliveries").update({ sent_at:new Date().toISOString() }).eq("id",delivery.id)
        } else if (response.status === 404 || response.status === 410) {
          expired++
          await supabase.from("push_subscriptions").delete().eq("id",subscription.id)
        } else {
          await supabase.from("push_notification_deliveries").delete().eq("id",delivery.id)
        }
      } catch (error) {
        console.error("[SIGA] Falha no push de atualização:", error)
        await supabase.from("push_notification_deliveries").delete().eq("id",delivery.id)
      }
    }

    console.log("[SIGA] Push de atualização:", { deploy:payload.id, sent, skipped, expired })
    return new Response(JSON.stringify({ ok:true, sent, skipped, expired }), { status:200 })
  } catch (error) {
    console.error("[SIGA] Erro no push pós-deploy:", error)
    return new Response("push update failed", { status:500 })
  }
}
