import { createClient } from "@supabase/supabase-js"
import { sendWebPush, isTrustedPushEndpoint, isValidPushKeys } from "../../lib/push/server"

type Subscription = { id:string; auth_user_id:string; role:"admin"|"coach"; endpoint:string; p256dh:string; auth_key:string }

export default async (req: Request) => {
  try {
    const { payload } = await req.json() as {
      payload?: {
        id?: string
        site_id?: string
        context?: string
        branch?: string
        state?: string
        published_at?: string | null
        commit_ref?: string | null
      }
    }
    if (!payload?.id || !/^[0-9a-f]{16,64}$/.test(payload.id)) return new Response("ignored", { status: 200 })
    // A successful build isn't necessarily the version visitors are using.
    if (payload.context !== "production" || (payload.branch && payload.branch !== "main")) {
      return new Response("non-production ignored", { status: 200 })
    }
    if (payload.site_id && payload.site_id !== "fc957316-76ec-422f-9e19-205905f88d2f") {
      return new Response("another site ignored", { status: 200 })
    }
    if (payload.state && payload.state !== "ready" && payload.state !== "current") {
      return new Response("deploy not ready", { status: 200 })
    }
    const publishTime = payload.published_at ? Date.parse(payload.published_at) : NaN
    if (!Number.isFinite(publishTime) || publishTime > Date.now() + 60000) {
      return new Response("not published yet", { status: 200 })
    }

    // Re-publishing an identical Git revision isn't a new system version.
    const versionId = /^[0-9a-f]{40}$/.test(payload.commit_ref || "")
      ? payload.commit_ref!
      : payload.id
    const eventKey = `system-update-${versionId}`
    const title = "SIGA — Sistema atualizado!"
    const body = "Uma nova versão do SIGA foi publicada. Toque para conferir."

    const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY
    if (!url || !key) throw new Error("Supabase não configurado")

    const supabase = createClient(url, key, { auth: { persistSession:false, autoRefreshToken:false } })
    const { data, error } = await supabase.from("push_subscriptions").select("id,auth_user_id,role,endpoint,p256dh,auth_key")
    if (error) throw error

    let sent=0, skipped=0, expired=0
    for (const subscription of (data || []) as Subscription[]) {
      // Unique database reservation + ten-minute consolidation across nearby publishes.
      const { data: reservedId, error: deliveryError } = await supabase
        .rpc("reserve_siga_system_update_push", {
          p_event_key: eventKey,
          p_subscription_id: subscription.id,
          p_auth_user_id: subscription.auth_user_id,
          p_role: subscription.role,
          p_title: title,
          p_body: body,
          p_href: subscription.role === "coach" ? "/trainer/dashboard" : "/",
        })
      if (deliveryError) throw deliveryError
      if (!reservedId) { skipped++; continue }
      const delivery = { id: reservedId }

      if (!delivery) continue

      try {
        if (!isTrustedPushEndpoint(subscription.endpoint) || !isValidPushKeys(subscription.p256dh, subscription.auth_key)) {
          await supabase.from("push_subscriptions").delete().eq("id", subscription.id)
          continue
        }
        const response = await sendWebPush(subscription, {
          id: eventKey, title,
          body,
          href: subscription.role === "coach" ? "/trainer/dashboard" : "/",
        })
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

    console.log("[SIGA] Push de atualização:", { deploy:payload.id, version:versionId, sent, skipped, expired })
    return new Response(JSON.stringify({ ok:true, sent, skipped, expired }), { status:200 })
  } catch (error) {
    console.error("[SIGA] Erro no push pós-deploy:", error)
    return new Response("push update failed", { status:500 })
  }
}
