import { createPrivateKey, sign } from "node:crypto"
import { createClient } from "@supabase/supabase-js"

export const config = {
  schedule: "*/10 * * * *",
}

type Role = "admin" | "coach"
type Subscription = {
  id: string
  auth_user_id: string
  role: Role
  endpoint: string
}

type PushMessage = {
  eventKey: string
  role: Role
  title: string
  body: string
  href: string
}

const WEEKDAYS = ["domingo", "segunda", "terça", "quarta", "quinta", "sexta", "sábado"]
const MONTHS = ["janeiro", "fevereiro", "março", "abril", "maio", "junho", "julho", "agosto", "setembro", "outubro", "novembro", "dezembro"]

function spNow() {
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Sao_Paulo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
    weekday: "short",
  })
  const parts = Object.fromEntries(formatter.formatToParts(new Date()).map((part) => [part.type, part.value]))
  const weekdayMap: Record<string, number> = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 }
  const year = Number(parts.year)
  const month = Number(parts.month)
  const day = Number(parts.day)
  const hour = Number(parts.hour)
  const minute = Number(parts.minute)
  const weekday = weekdayMap[parts.weekday] ?? 0
  return {
    year, month, day, hour, minute, weekday,
    date: `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`,
    minutes: hour * 60 + minute,
  }
}

function isLastDay(year: number, month: number, day: number) {
  return day === new Date(Date.UTC(year, month, 0)).getUTCDate()
}

function b64url(input: Buffer | string) {
  return Buffer.from(input).toString("base64url")
}

function decodeB64url(value: string) {
  return Buffer.from(value, "base64url")
}

function vapidAuthorization(endpoint: string) {
  const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
  const privateKey = process.env.VAPID_PRIVATE_KEY
  const subject = process.env.VAPID_SUBJECT || "https://plataformasiga.netlify.app"
  if (!publicKey || !privateKey) throw new Error("VAPID não configurado")

  const publicBytes = decodeB64url(publicKey)
  if (publicBytes.length !== 65 || publicBytes[0] !== 4) throw new Error("Chave pública VAPID inválida")
  const privateBytes = decodeB64url(privateKey)
  if (privateBytes.length !== 32) throw new Error("Chave privada VAPID inválida")

  const key = createPrivateKey({
    key: {
      kty: "EC",
      crv: "P-256",
      x: b64url(publicBytes.subarray(1, 33)),
      y: b64url(publicBytes.subarray(33, 65)),
      d: b64url(privateBytes),
    },
    format: "jwk",
  })

  const header = b64url(JSON.stringify({ typ: "JWT", alg: "ES256" }))
  const payload = b64url(JSON.stringify({
    aud: new URL(endpoint).origin,
    exp: Math.floor(Date.now() / 1000) + 12 * 60 * 60,
    sub: subject,
  }))
  const unsigned = `${header}.${payload}`
  const signature = sign("sha256", Buffer.from(unsigned), { key, dsaEncoding: "ieee-p1363" })
  return `vapid t=${unsigned}.${b64url(signature)}, k=${publicKey}`
}

async function sendEmptyWebPush(endpoint: string) {
  return fetch(endpoint, {
    method: "POST",
    headers: {
      Authorization: vapidAuthorization(endpoint),
      TTL: "300",
      Urgency: "high",
    },
  })
}

export async function runPushScheduler() {
  const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!supabaseUrl || !serviceKey) throw new Error("Supabase não configurado")
  if (!process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || !process.env.VAPID_PRIVATE_KEY) {
    throw new Error("Chaves VAPID não configuradas")
  }

  const supabase = createClient(supabaseUrl, serviceKey, { auth: { persistSession: false, autoRefreshToken: false } })
  const now = spNow()
  const messages: PushMessage[] = []

  const { data: postponedPayments, error: postponedError } = await supabase
    .from("payments")
    .select("id,student_id,month,postponed_to")
    .eq("status", "Adiado")
    .gte("postponed_to", `${now.date}T00:00:00`)
    .lt("postponed_to", `${now.date}T23:59:59.999`)
  if (postponedError) throw postponedError

  const postponedStudentIds = Array.from(new Set((postponedPayments || []).map((payment: any) => payment.student_id)))
  let postponedStudentById = new Map<string, any>()
  if (postponedStudentIds.length) {
    const { data: postponedStudents, error: postponedStudentsError } = await supabase
      .from("students")
      .select("id,name,responsible")
      .in("id", postponedStudentIds)
    if (postponedStudentsError) throw postponedStudentsError
    postponedStudentById = new Map((postponedStudents || []).map((student: any) => [student.id, student]))
  }

  for (const payment of postponedPayments || []) {
    const student = postponedStudentById.get(payment.student_id)
    const studentName = student?.name || "Aluno não identificado"
    const responsibleName = student?.responsible || "Responsável não informado"
    messages.push({
      eventKey: `admin-postponed-due-${payment.id}-${now.date}`,
      role: "admin",
      title: "Mensalidade adiada vence hoje",
      body: `${studentName} — responsável: ${responsibleName}. ${payment.month ? `Mensalidade de ${payment.month}.` : "Confira a mensalidade adiada."}`,
      href: "/payments",
    })
  }

  if (now.day === 1 && now.minutes >= 8 * 60) {
    messages.push({
      eventKey: `admin-month-start-${now.year}-${now.month}`,
      role: "admin",
      title: `Chegamos em ${MONTHS[now.month - 1]}!`,
      body: "Envie a mensagem de abertura da mensalidade nos grupos da escolinha.",
      href: "/payments",
    })
  }

  if (now.day === 10 && now.minutes >= 8 * 60) {
    messages.push({
      eventKey: `admin-due-date-${now.year}-${now.month}`,
      role: "admin",
      title: "Hoje é dia de vencimento",
      body: `As mensalidades de ${MONTHS[now.month - 1]} vencem hoje. Envie o lembrete nos grupos.`,
      href: "/payments",
    })
  }

  if (isLastDay(now.year, now.month, now.day) && now.minutes >= 18 * 60) {
    const [{ data: payments, error: paymentsError }, { data: students, error: studentsError }] = await Promise.all([
      supabase.from("payments").select("student_id,status").eq("month_number", now.month).eq("year_number", now.year),
      supabase.from("students").select("id,name,registration_date,created_at"),
    ])
    if (paymentsError) throw paymentsError
    if (studentsError) throw studentsError

    const pendingStatuses = new Set(["Em Aberto", "Não Pagou", "Cobrado", "Adiado", "Novo"])
    const pendingIds = new Set((payments || []).filter((p: any) => pendingStatuses.has(p.status)).map((p: any) => p.student_id))
    const prefix = `${now.year}-${String(now.month).padStart(2, "0")}`
    const newStudents = (students || []).filter((s: any) => String(s.registration_date || s.created_at || "").startsWith(prefix))

    messages.push({
      eventKey: `admin-month-close-${now.year}-${now.month}`,
      role: "admin",
      title: `Fechamento de ${MONTHS[now.month - 1]}`,
      body: `${pendingIds.size} pendência${pendingIds.size === 1 ? "" : "s"} e ${newStudents.length} aluno${newStudents.length === 1 ? " novo" : "s novos"} neste mês. Abra o SIGA para conferir.`,
      href: "/payments",
    })
  }

  if (now.weekday >= 1 && now.weekday <= 5) {
    const { data: attendance, error } = await supabase
      .from("attendance")
      .select("class_schedule")
      .eq("date", now.date)
    if (error) throw error
    const completed = new Set((attendance || []).map((row: any) => row.class_schedule))

    if (now.minutes >= 18 * 60 && now.minutes < 19 * 60 + 30 && !completed.has("18:00-19:30")) {
      messages.push({
        eventKey: `coach-first-call-${now.date}`,
        role: "coach",
        title: "SIGA — Lembrete de chamada",
        body: `Não esqueça de fazer a chamada de ${WEEKDAYS[now.weekday]} — 1º horário.`,
        href: "/trainer/chamada",
      })
    }

    if (now.minutes >= 19 * 60 + 40 && !completed.has("19:30-21:00")) {
      messages.push({
        eventKey: `coach-second-call-${now.date}`,
        role: "coach",
        title: "SIGA — Lembrete de chamada",
        body: `Não esqueça de fazer a chamada de ${WEEKDAYS[now.weekday]} — 2º horário.`,
        href: "/trainer/chamada",
      })
    }
  }

  let sent = 0
  let skipped = 0
  let expired = 0

  for (const message of messages) {
    const { data: subscriptions, error } = await supabase
      .from("push_subscriptions")
      .select("id,auth_user_id,role,endpoint")
      .eq("role", message.role)
    if (error) throw error

    for (const subscription of (subscriptions || []) as Subscription[]) {
      const { data: reserved, error: reserveError } = await supabase
        .from("push_notification_deliveries")
        .insert({
          event_key: message.eventKey,
          subscription_id: subscription.id,
          auth_user_id: subscription.auth_user_id,
          role: message.role,
          title: message.title,
          body: message.body,
          href: message.href,
        })
        .select("id")
        .maybeSingle()

      if (reserveError) {
        if ((reserveError as any).code === "23505") {
          skipped += 1
          continue
        }
        throw reserveError
      }
      if (!reserved) continue

      try {
        const response = await sendEmptyWebPush(subscription.endpoint)
        if (response.ok) {
          sent += 1
          await supabase.from("push_notification_deliveries").update({ sent_at: new Date().toISOString() }).eq("id", reserved.id)
        } else if (response.status === 404 || response.status === 410) {
          expired += 1
          await supabase.from("push_subscriptions").delete().eq("id", subscription.id)
        } else {
          const text = await response.text().catch(() => "")
          console.error(`[SIGA] Push recusado (${response.status}): ${text.slice(0, 300)}`)
          await supabase.from("push_notification_deliveries").delete().eq("id", reserved.id)
        }
      } catch (error) {
        console.error("[SIGA] Falha ao enviar push:", error)
        await supabase.from("push_notification_deliveries").delete().eq("id", reserved.id)
      }
    }
  }

  return { ok: true, messages: messages.length, sent, skipped, expired, time: now }
}

export default async () => {
  try {
    const result = await runPushScheduler()
    console.log("[SIGA] Push scheduler:", result)
    return new Response(JSON.stringify(result), { status: 200, headers: { "Content-Type": "application/json" } })
  } catch (error) {
    console.error("[SIGA] Erro no scheduler de push:", error)
    return new Response(JSON.stringify({ ok: false, error: "push scheduler failed" }), { status: 500, headers: { "Content-Type": "application/json" } })
  }
}
