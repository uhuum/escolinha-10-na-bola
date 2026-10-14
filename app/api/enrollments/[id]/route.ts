import { NextRequest } from "next/server"
import { approvalSchema } from "@/lib/enrollment/validation"
import { json, readBody, requireAdmin } from "@/lib/enrollment/server"
export const runtime = "nodejs"

export async function POST(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  const auth = await requireAdmin()
  if (auth.error) return auth.error
  const { id } = await context.params
  if (!/^[a-f0-9-]{36}$/i.test(id)) return json({ error: "Matrícula inválida." }, 400)
  let body
  try { body = await readBody(req) } catch { return json({ error: "Solicitação inválida." }, 400) }
  if (body?.action === "cancel") {
    const { data, error } = await auth.client.from("enrollment_requests").update({ status: "cancelled" }).eq("id", id).in("status", ["invited", "pending"]).select("id").maybeSingle()
    if (error) return json({ error: "Não foi possível encerrar a ficha." }, 503)
    if (!data) return json({ error: "A ficha já foi aprovada ou encerrada. Atualize a lista." }, 409)
    return json({ ok: true })
  }
  if (body?.action !== "approve") return json({ error: "Ação inválida." }, 400)
  const parsed = approvalSchema.safeParse(body.approval)
  if (!parsed.success) return json({ error: parsed.error.issues[0].message }, 400)
  const { data, error } = await auth.client.rpc("approve_enrollment", { p_request_id: id, p_approval: parsed.data })
  if (error) {
    if (error.message.includes("DUPLICATE_STUDENT")) return json({ error: "Já existe um aluno com esse documento ou nome e nascimento. Confira o cadastro existente antes de aprovar." }, 409)
    if (error.message.includes("NOT_PENDING")) return json({ error: "A ficha não está pendente. Atualize a lista." }, 409)
    return json({ error: "Não foi possível aprovar a matrícula. Nenhum cadastro parcial foi confirmado." }, 503)
  }
  return json({ studentId: data })
}
