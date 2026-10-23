import { createClient } from "@supabase/supabase-js"
import { sendWebPush, isTrustedPushEndpoint, isValidPushKeys } from "../../lib/push/server"

export const config = { schedule: "0 12 * * *" } // 09:00 in Sao Paulo (UTC-3)

type Candidate = { student_id: string; student_name: string; episode_anchor: string }
type Subscription = { id: string; auth_user_id: string; endpoint: string; p256dh: string; auth_key: string }
type Delivery = { id: number; sent_at: string | null }

export default async function checkThreeWeeksAbsent(): Promise<Response> {
  const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) throw new Error("Supabase configuration unavailable")
  const db = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } })

  const [{ data: candidates, error: candidateError }, { data: devices, error: deviceError }] = await Promise.all([
    db.rpc("list_students_absent_three_weeks"),
    db.from("push_subscriptions").select("id,auth_user_id,endpoint,p256dh,auth_key").eq("role", "admin"),
  ])
  if (candidateError) throw candidateError
  if (deviceError) throw deviceError

  let sent = 0, skipped = 0, failed = 0
  for (const student of (candidates || []) as Candidate[]) {
    const episodeKey = (student.episode_anchor || "initial").replace(/[^0-9-]/g, "").slice(0, 12) || "initial"
    const eventKey = `attendance-3weeks-${student.student_id}-${episodeKey}`
    const title = "Atenção à frequência: 3 semanas"
    const body = `${student.student_name} está há pelo menos 3 semanas sem presença registrada. Entre em contato com a família.`
    const href = `/students/${student.student_id}`

    for (const device of (devices || []) as Subscription[]) {
      try {
        if (!isTrustedPushEndpoint(device.endpoint) || !isValidPushKeys(device.p256dh, device.auth_key)) {
          await db.from("push_subscriptions").delete().eq("id", device.id)
          continue
        }
        const { data: inserted, error: insertError } = await db.from("push_notification_deliveries")
          .insert({ event_key: eventKey, subscription_id: device.id, auth_user_id: device.auth_user_id,
            role: "admin", title, body, href }).select("id,sent_at").single()
        let delivery = inserted as Delivery | null
        if (insertError) {
          if (insertError.code !== "23505") throw insertError
          const { data: previous, error: priorError } = await db.from("push_notification_deliveries")
            .select("id,sent_at").eq("event_key", eventKey).eq("subscription_id", device.id).single()
          if (priorError) throw priorError
          delivery = previous as Delivery
        }
        if (!delivery) throw new Error("Cannot register attendance alert")
        if (delivery.sent_at) { skipped++; continue }
        const response = await sendWebPush(device, { id: eventKey, title, body, href })
        if (response.ok) {
          const { error: markError } = await db.from("push_notification_deliveries")
            .update({ sent_at: new Date().toISOString() }).eq("id", delivery.id)
          if (markError) throw markError
          sent++
        } else if (response.status === 404 || response.status === 410) {
          await db.from("push_subscriptions").delete().eq("id", device.id)
        } else {
          failed++
          console.error("[SIGA] Alerta de faltas recusado:", response.status)
        }
      } catch (error) {
        failed++
        console.error("[SIGA] Falha no alerta de frequencia:", error)
      }
    }
  }
  return new Response(JSON.stringify({ checked: (candidates || []).length, sent, skipped, failed }), {
    headers: { "Content-Type": "application/json" }, status: 200,
  })
}
