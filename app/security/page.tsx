"use client"

import { useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import { ShieldCheck, KeyRound, LogOut, CheckCircle2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { getBrowserClient } from "@/lib/supabase/client"
import { useAuth } from "@/lib/contexts/auth-context"

type Stage = "checking" | "enroll" | "setup" | "verify" | "completed"

export default function AdminSecurityPage() {
  const router = useRouter()
  const supabase = useMemo(() => getBrowserClient(), [])
  const { logout } = useAuth()
  const [stage, setStage] = useState<Stage>("checking")
  const [factorId, setFactorId] = useState("")
  const [qrCode, setQrCode] = useState("")
  const [secret, setSecret] = useState("")
  const [code, setCode] = useState("")
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState("")

  useEffect(() => {
    let active = true
    const load = async () => {
      try {
        const { data: userData, error: authError } = await supabase.auth.getUser()
        if (authError || !userData.user || userData.user.app_metadata?.role !== "admin") {
          router.replace("/login")
          return
        }
        const { data: aal, error: aalError } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel()
        if (aalError) throw aalError
        if (aal.currentLevel === "aal2") {
          router.replace("/")
          return
        }
        const { data: factors, error: listError } = await supabase.auth.mfa.listFactors()
        if (listError) throw listError
        if (!active) return
        const verified = factors?.totp?.find(f => f.status === "verified")
        if (verified) {
          setFactorId(verified.id)
          setStage("verify")
        } else {
          setStage("enroll")
        }
      } catch {
        if (active) { setError("Não foi possível verificar sua segurança. Atualize a página."); setStage("enroll") }
      }
    }
    void load()
    return () => { active = false }
  }, [supabase, router])

  const startSetup = async () => {
    setBusy(true); setError("")
    try {
      const { data, error: setupError } = await supabase.auth.mfa.enroll({
        factorType: "totp", friendlyName: "SIGA 10 na Bola"
      })
      if (setupError || !data?.id || !data.totp) throw setupError || new Error("Falha no cadastro")
      setFactorId(data.id)
      setQrCode(data.totp.qr_code)
      setSecret(data.totp.secret)
      setStage("setup")
    } catch {
      setError("Não foi possível gerar o autenticador. Tente novamente.")
    } finally { setBusy(false) }
  }

  const verify = async () => {
    if (!factorId || !/^\d{6}$/.test(code)) {
      setError("Digite os seis números exibidos no aplicativo autenticador.")
      return
    }
    setBusy(true); setError("")
    try {
      const { error: verifyError } = await supabase.auth.mfa.challengeAndVerify({ factorId, code })
      if (verifyError) throw verifyError
      const { data: assurance, error: assuranceError } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel()
      if (assuranceError || assurance?.currentLevel !== "aal2") throw assuranceError || new Error("MFA não confirmada")
      setStage("completed")
      router.replace("/")
      router.refresh()
    } catch {
      setCode("")
      setError("Código inválido ou expirado. Confira o horário do celular e tente novamente.")
    } finally { setBusy(false) }
  }

  return <main className="min-h-screen bg-[#0a1628] flex items-center justify-center p-4">
    <Card className="w-full max-w-md border-blue-500/20 shadow-2xl">
      <CardHeader className="items-center text-center gap-2">
        <Image src="/logo-ceap.png" alt="10 na Bola" width={72} height={72} className="object-contain" />
        <ShieldCheck className="h-9 w-9 text-blue-600" />
        <CardTitle>Proteção do administrativo</CardTitle>
        <CardDescription>
          Por segurança dos dados das famílias, o SIGA exige um código de autenticação além da senha.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {stage === "checking" && <p className="text-center text-sm">Verificando sua autenticação...</p>}
        {stage === "enroll" && <>
          <p className="text-sm">Instale Google Authenticator ou Microsoft Authenticator no seu celular.
            Depois, clique para gerar o QR Code e vincular sua conta administrativa.</p>
          <Button className="w-full" disabled={busy} onClick={startSetup}>
            <KeyRound className="mr-2 h-4 w-4" />
            {busy ? "Preparando..." : "Cadastrar autenticador"}
          </Button>
        </>}
        {stage === "setup" && <>
          <p className="text-sm font-medium">1. Abra o autenticador no celular e escaneie este QR Code:</p>
          {qrCode && <div className="flex justify-center rounded-lg bg-white p-3">
            <img src={qrCode} alt="QR Code exclusivo para o aplicativo autenticador" width={200} height={200} />
          </div>}
          <p className="text-xs text-muted-foreground">Se não conseguir escanear, adicione esta chave manualmente. Não compartilhe com ninguém:</p>
          {secret && <div className="rounded-md bg-muted p-2 text-center font-mono text-xs break-all select-all">{secret}</div>}
          <p className="text-sm font-medium">2. Digite o código de seis dígitos gerado no celular:</p>
        </>}
        {(stage === "setup" || stage === "verify") && <>
          {stage === "verify" && <p className="text-sm">Abra o aplicativo autenticador e informe o código de seis dígitos da conta SIGA.</p>}
          <Label htmlFor="mfa-code">Código de verificação</Label>
          <Input id="mfa-code" inputMode="numeric" autoComplete="one-time-code"
            maxLength={6} placeholder="000000" value={code}
            onChange={event => setCode(event.target.value.replace(/\D/g, "").slice(0, 6))} />
          <Button className="w-full" disabled={busy || code.length !== 6} onClick={verify}>
            {busy ? "Verificando..." : stage === "setup" ? "Ativar e entrar no SIGA" : "Confirmar e entrar"}
          </Button>
        </>}
        {stage === "completed" && <p className="flex items-center justify-center gap-2 text-sm text-green-700">
          <CheckCircle2 className="h-5 w-5" /> Verificação concluída.
        </p>}
        {error && <p role="alert" className="rounded-md border border-red-500/30 bg-red-50 p-3 text-sm text-red-700">{error}</p>}
        <Button variant="ghost" className="w-full" onClick={logout}>
          <LogOut className="mr-2 h-4 w-4" /> Sair da conta
        </Button>
        <p className="text-xs text-muted-foreground text-center">
          Não envie o código ou a chave de configuração por WhatsApp. Se perder o autenticador, procure o administrador da plataforma para recuperação segura.
        </p>
      </CardContent>
    </Card>
  </main>
}
