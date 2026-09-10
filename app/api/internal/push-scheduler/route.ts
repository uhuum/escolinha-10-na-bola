import { timingSafeEqual } from "node:crypto"
import { NextResponse } from "next/server"
import { runPushScheduler } from "../../../../netlify/functions/push-notifications.mts"

export const dynamic = "force-dynamic"
export const runtime = "nodejs"

function safeEqual(a: string, b: string) {
  const aBuffer = Buffer.from(a)
  const bBuffer = Buffer.from(b)
  if (aBuffer.length !== bBuffer.length) return false
  return timingSafeEqual(aBuffer, bBuffer)
}

export async function POST(request: Request) {
  try {
    const token = request.headers.get("x-siga-cron-token")?.trim()
    const expected = process.env.SIGA_CRON_TOKEN?.trim()

    if (!token || !expected || token.length > 256 || !safeEqual(token, expected)) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
    }

    const result = await runPushScheduler()
    return NextResponse.json(result, { headers: { "Cache-Control": "no-store" } })
  } catch (error) {
    console.error("[SIGA] Falha no endpoint interno do scheduler:", error)
    return NextResponse.json({ ok: false, error: "push scheduler failed" }, { status: 500 })
  }
}
