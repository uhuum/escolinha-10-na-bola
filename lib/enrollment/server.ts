import { createHash } from "node:crypto"
import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { createServerSupabaseClient } from "@/lib/supabase/server"

export function json(data: unknown, status = 200) {
  return NextResponse.json(data, { status, headers: { "Cache-Control": "private, no-store", "Referrer-Policy": "no-referrer" } })
}
export function tokenHash(token: string) {
  return createHash("sha256").update(token).digest("hex")
}
export function serviceClient() {
  const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) throw new Error("Enrollment unavailable")
  return createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } })
}
export async function requireAdmin() {
  const client = await createServerSupabaseClient()
  const { data, error } = await client.auth.getUser()
  if (error || !data.user) return { error: json({ error: "Entre na sua conta para continuar." }, 401) } as const
  if (data.user.app_metadata?.role !== "admin") return { error: json({ error: "Acesso restrito ao administrativo." }, 403) } as const
  return { client, user: data.user } as const
}
export async function readBody(req: NextRequest) {
  // Reject cross-origin form posts and cap the actual body, not only its header.
  if (req.headers.get("origin") !== new URL(req.url).origin || !req.headers.get("content-type")?.startsWith("application/json")) throw new Error("Invalid request")
  const reader = req.body?.getReader()
  if (!reader) throw new Error("Empty request")
  let bytes = 0
  let text = ""
  const decoder = new TextDecoder()
  while (true) {
    const part = await reader.read()
    if (part.done) break
    bytes += part.value.length
    if (bytes > 16384) { await reader.cancel(); throw new Error("Request too large") }
    text += decoder.decode(part.value, { stream: true })
  }
  text += decoder.decode()
  return JSON.parse(text)
}
