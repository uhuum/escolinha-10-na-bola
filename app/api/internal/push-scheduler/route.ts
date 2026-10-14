import { NextResponse } from "next/server"

// Rota de acionamento com identificador fixo desativada. O agendamento oficial permanece no Netlify.
export async function POST() {
  return NextResponse.json({ error: "Endpoint desativado" }, { status: 410 })
}
