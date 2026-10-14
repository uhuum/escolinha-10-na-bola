import type { Config } from "@netlify/functions"
import { createClient } from "@supabase/supabase-js"
import { runPushScheduler } from "./push-notifications.mts"

function saoPauloDate() {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Sao_Paulo", year: "numeric", month: "2-digit", day: "2-digit",
  }).formatToParts(new Date())
  const obj = Object.fromEntries(parts.map(p => [p.type, p.value]))
  return obj.year + "-" + obj.month + "-" + obj.day
}

export default async () => {
  // O status "Não Pagou" só começa no dia SEGUINTE ao vencimento individual.
  // Esta rotina não altera pagamentos pagos, bolsas, cobranças ou adiamentos.
  const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) throw new Error("Supabase não configurado")
  const supabase = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } })
  const today = saoPauloDate()
  const { data: changed, error: updateError } = await supabase.from("payments")
    .update({ status: "Não Pagou" })
    .eq("status", "Em Aberto")
    .lt("due_date", today)
    .select("id")
  if (updateError) throw updateError
  console.log("[SIGA] Vencimentos individuais processados:", changed?.length || 0)

  try {
    const result = await runPushScheduler()
    console.log("[SIGA] Scheduler de meia-noite:", result)
  } catch (error) {
    console.error("[SIGA] Erro no scheduler de meia-noite:", error)
    throw error
  }
}

// Netlify executa CRON em UTC. 03:00 UTC = 00:00 em America/Sao_Paulo.
export const config: Config = {
  schedule: "0 3 * * *",
}
