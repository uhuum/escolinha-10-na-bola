import { randomBytes } from "node:crypto"
import { NextRequest } from "next/server"
import { json, readBody, requireAdmin, tokenHash } from "@/lib/enrollment/server"
export const runtime = "nodejs"

export async function GET(req: NextRequest) {
  const auth = await requireAdmin()
  if (auth.error) return auth.error
  const status = req.nextUrl.searchParams.get("status") || "pending"
  const page = Number(req.nextUrl.searchParams.get("page") || "0")
  if (!["pending", "invited", "approved", "cancelled"].includes(status) || !Number.isInteger(page) || page < 0 || page > 10000) return json({ error: "Filtro inválido." }, 400)
  const { data, error, count } = await auth.client.from("enrollment_requests")
    .select("id,label,status,created_at,expires_at,submitted_at,payload,approval,student_id,approved_at", { count: "exact" })
    .eq("status", status).order("created_at", { ascending: false }).order("id").range(page * 25, page * 25 + 24)
  if (error) return json({ error: "Não foi possível carregar as matrículas. Verifique se o recurso foi ativado no banco." }, 503)
  return json({ requests: data, total: count })
}
export async function POST(req: NextRequest) {
  const auth = await requireAdmin()
  if (auth.error) return auth.error
  let body
  try { body = await readBody(req) } catch { return json({ error: "Solicitação inválida." }, 400) }
  const label = typeof body?.label === "string" ? body.label.trim() : ""
  if (!label || label.length > 100) return json({ error: "Informe uma identificação de até 100 caracteres para o convite." }, 400)
  const token = randomBytes(32).toString("hex")
  const expiresAt = new Date(Date.now() + 14 * 86400000).toISOString()
  const { data, error } = await auth.client.from("enrollment_requests").insert({ label, token_hash: tokenHash(token), expires_at: expiresAt, created_by: auth.user.id }).select("id").single()
  if (error) return json({ error: "Não foi possível criar o convite. Verifique se o recurso foi ativado no banco." }, 503)
  return json({ id: data.id, path: `/matricula?convite=${token}`, expiresAt }, 201)
}
