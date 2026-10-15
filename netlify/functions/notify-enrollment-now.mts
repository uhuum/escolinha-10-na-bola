import { timingSafeEqual } from "node:crypto"
import { processEnrollmentNotifications } from "./push-new-enrollments.mts"

export default async function notifyEnrollmentNow(request: Request): Promise<Response> {
  if (request.method !== "POST") return new Response("Method Not Allowed", { status: 405 })
  const expected = process.env.SIGA_ENROLLMENT_PUSH_WEBHOOK_TOKEN
  const actual = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "") || ""
  if (!expected || actual.length !== expected.length ||
      !timingSafeEqual(Buffer.from(actual), Buffer.from(expected))) {
    return new Response("Unauthorized", { status: 401 })
  }
  try {
    return await processEnrollmentNotifications()
  } catch (error) {
    console.error("[SIGA] Falha no disparo imediato de matrículas:", error)
    return new Response("Failed to process new enrollments", { status: 503 })
  }
}
