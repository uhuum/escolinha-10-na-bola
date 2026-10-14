import { NextRequest } from "next/server"
import { enrollmentSchema, privacyVersion } from "@/lib/enrollment/validation"
import { json, readBody, serviceClient, tokenHash } from "@/lib/enrollment/server"
export const runtime = "nodejs"

export async function POST(req: NextRequest) {
  let body
  try { body = await readBody(req) } catch { return json({ error: "Não foi possível ler a ficha. Tente novamente." }, 400) }
  if (!/^[a-f0-9]{64}$/.test(body?.token || "") || !["check", "submit"].includes(body?.action)) return json({ error: "Link inválido." }, 400)
  try {
    const db = serviceClient()
    const hash = tokenHash(body.token)
    const { data: invitation, error } = await db.from("enrollment_requests").select("id,status,expires_at").eq("token_hash", hash).maybeSingle()
    if (error) throw error
    if (!invitation || invitation.status === "cancelled" || (invitation.status === "invited" && new Date(invitation.expires_at).getTime() <= Date.now())) return json({ error: "Este link expirou ou foi encerrado. Solicite um novo link ao administrativo." }, 410)
    // Never return submitted personal information through a public link.
    if (invitation.status !== "invited") return json({ status: "received" })
    if (body.action === "check") return json({ status: "open" })
    if (body.website) return json({ error: "Não foi possível enviar a ficha." }, 400)
    const parsed = enrollmentSchema.safeParse(body.data)
    if (!parsed.success) return json({ error: parsed.error.issues[0].message }, 400)
    const now = new Date().toISOString()
    const { data: saved, error: saveError } = await db.from("enrollment_requests").update({ payload: parsed.data, status: "pending", submitted_at: now, privacy_version: privacyVersion })
      .eq("id", invitation.id).eq("status", "invited").gt("expires_at", now).select("id").maybeSingle()
    if (saveError) throw saveError
    if (!saved) {
      const { data: latest, error: latestError } = await db.from("enrollment_requests").select("status").eq("id", invitation.id).single()
      if (latestError) throw latestError
      if (!["pending", "approved"].includes(latest.status)) return json({ error: "O link foi encerrado. Fale com o administrativo." }, 409)
    }
    return json({ status: "received" })
  } catch { return json({ error: "O envio está indisponível no momento. Seus dados não foram confirmados; tente novamente mais tarde." }, 503) }
}
