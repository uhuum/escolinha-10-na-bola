import { NextResponse } from "next/server"
import { runPushScheduler } from "../../../../netlify/functions/push-notifications.mts"

export const dynamic = "force-dynamic"
export const runtime = "nodejs"

const CRON_SOURCE = "siga-push-fallback-v1"

export async function POST(request: Request) {
  try {
    const source = request.headers.get("x-siga-cron-source")?.trim()

    if (source !== CRON_SOURCE) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
    }

    const result = await runPushScheduler()
    return NextResponse.json(result, { headers: { "Cache-Control": "no-store" } })
  } catch (error) {
    console.error("[SIGA] Falha no endpoint interno do scheduler:", error)
    return NextResponse.json({ ok: false, error: "push scheduler failed" }, { status: 500 })
  }
}
