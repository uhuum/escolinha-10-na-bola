import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { createServerSupabaseClient } from "@/lib/supabase/server"

export const dynamic = "force-dynamic"

export async function GET(request: Request) {
  const noStore = { "Cache-Control": "private, no-store" }
  try {
    const auth = await createServerSupabaseClient()
    const { data: { user }, error } = await auth.auth.getUser()
    if (error || !user) return NextResponse.json({ error: "Não autenticado" }, { status: 401, headers: noStore })
    const role = user.app_metadata?.role
    if (role !== "admin" && role !== "coach") return NextResponse.json({ error: "Acesso negado" }, { status: 403, headers: noStore })

    const dateParam = new URL(request.url).searchParams.get("since")
    const sinceMillis = dateParam ? Date.parse(dateParam) : NaN
    const minimum = Date.now() - 5 * 60 * 1000
    const since = new Date(Number.isFinite(sinceMillis) ? Math.max(minimum, Math.min(Date.now(), sinceMillis)) : minimum).toISOString()

    const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY
    if (!url || !key) throw new Error("Supabase indisponível")
    const service = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } })
    const { data, error: queryError } = await service.from("push_notification_deliveries")
      .select("event_key,title,body,href,sent_at")
      .eq("auth_user_id", user.id)
      .eq("role", role)
      .not("sent_at", "is", null)
      .gte("sent_at", since)
      .order("sent_at", { ascending: false })
      .limit(30)
    if (queryError) throw queryError
    return NextResponse.json({ notifications: data || [] }, { headers: noStore })
  } catch (error) {
    console.error("[SIGA] Erro ao buscar avisos recentes:", error)
    return NextResponse.json({ error: "Falha ao consultar avisos" }, { status: 500, headers: noStore })
  }
}
