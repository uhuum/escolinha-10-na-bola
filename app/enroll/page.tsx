"use client"

import { useEffect } from "react"

// A ficha pública única é mantida no aplicativo de matrícula digital.
// O convite continua no fragmento URL e não entra em logs ou requisições.
export default function EnrollmentPage() {
  useEffect(() => {
    window.location.replace("https://matricula10nabola.netlify.app/" + window.location.hash)
  }, [])

  return <main className="flex min-h-screen items-center justify-center bg-slate-50 px-5 text-center">
    <div className="space-y-3">
      <h1 className="text-xl font-bold text-slate-900">Matrícula Digital 10 na Bola</h1>
      <p className="text-sm text-slate-600">Abrindo o formulário atualizado...</p>
      <a className="text-sm font-semibold text-blue-700 underline"
        href="https://matricula10nabola.netlify.app/">Abrir matrícula digital</a>
    </div>
  </main>
}
