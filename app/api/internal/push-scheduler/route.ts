import { createHash, timingSafeEqual } from "node:crypto"
import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { runPushScheduler } from "@/netlify/functions/push-notifications"

export const dynamic = "force-dynamic"
export const runtime = "nodejs"

function adminClient() {
  const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) throw new Error("Configuração do Supabase indisponível")
  return createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } })
}

function sha256(value: string) {
  return createHash("sha256").update(value).digest("hex")
}

function safeEqualHex(a: string, b: string) {
  if (a.length !== b.length) return false
  return timingSafeEqual(Buffer.from(a, "hex"), Buffer.from(b, "hex"))
}

export async function POST(request: Request) {
  try {
    const token = request.headers.get("x-siga-cron-token")?.trim()
    if (!token || token.length > 256) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
    }

    const service = adminClient()
    const { data, error } = await service
      .from("system_cron_secrets")
      .select("secret_hash")
      .eq("name", "push_scheduler")
      .maybeSingle()

    if (error) throw error
    const expected = data?.secret_hash
    if (!expected || !safeEqualHex(sha256(token), expected)) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
    }

    const result = await runPushScheduler()
    return NextResponse.json(result, { headers: { "Cache-Control": "no-store" } })
  } catch (error) {
    console.error("[SIGA] Falha no endpoint interno do scheduler:", error)
    return NextResponse.json({ ok: false, error: "push scheduler failed" }, { status: 500 })
  }
}
