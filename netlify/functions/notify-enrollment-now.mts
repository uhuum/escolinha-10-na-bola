import { createClient } from "@supabase/supabase-js"
import { processEnrollmentNotifications } from "./push-new-enrollments.mts"

// The webhook secret stays in Supabase Vault. The Netlify Function asks Supabase
// to verify the caller using the existing service-role credentials. Never
// allow an unauthenticated request to trigger push delivery.
export default async function notifyEnrollmentNow(request: Request): Promise<Response> {
  if (request.method !== "POST") return new Response("Method Not Allowed", { status: 405 })

  const token = request.headers.get("authorization")?.match(/^Bearer\s+(\S+)$/i)?.[1] || ""
  if (token.length < 40 || token.length > 200) {
    return new Response("Unauthorized", { status: 401 })
  }

  const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !serviceKey) return new Response("Server configuration unavailable", { status: 503 })

  try {
    const db = createClient(url, serviceKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    })
    const { data: authorized, error: authError } = await db.rpc("verify_siga_enrollment_webhook", {
      p_token: token,
    })
    if (authError) {
      console.error("[SIGA] Webhook authentication unavailable:", authError.code)
      return new Response("Authentication unavailable", { status: 503 })
    }
    if (authorized !== true) return new Response("Unauthorized", { status: 401 })

    return await processEnrollmentNotifications()
  } catch (error) {
    console.error("[SIGA] Erro ao processar a notificação imediata:", error)
    return new Response("Failed to process new enrollments", { status: 503 })
  }
}
