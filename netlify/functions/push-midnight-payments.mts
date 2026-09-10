import type { Config } from "@netlify/functions"
import { runPushScheduler } from "./push-notifications.mts"

export default async () => {
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
