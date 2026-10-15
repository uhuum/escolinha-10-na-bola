"use client"

import { useState } from "react"
import { Bell, BellRing, CircleAlert, Loader2, Smartphone } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { usePushNotifications } from "@/lib/hooks/use-push-notifications"

// This popover configures native push only. In-app notification cards and
// automatic toast banners were removed at the user's request.
export function NotificationCenter({ user: _user }: { user: { id: string; role: "admin" | "coach" } }) {
  const push = usePushNotifications()
  const [feedback, setFeedback] = useState("")

  const testNotification = async () => {
    setFeedback("")
    const ok = await push.test()
    setFeedback(ok
      ? "O teste foi enviado ao serviço de notificações do aparelho."
      : "Não foi possível enviar o teste. Confira a permissão do celular.")
  }

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="sm" className="relative h-9 w-9 px-0 text-white hover:bg-white/10"
          aria-label="Configurar notificações push do celular">
          <Bell className="h-5 w-5" />
        </Button>
      </PopoverTrigger>

      <PopoverContent align="end" className="w-[calc(100vw-24px)] max-w-[370px] space-y-4 p-4 shadow-xl">
        <div>
          <p className="font-semibold">Notificações do celular</p>
          <p className="mt-1 text-xs text-muted-foreground">
            Os avisos chegam pelo sistema do iPhone ou Android, mesmo com o SIGA fechado.
          </p>
        </div>

        {push.state === "loading" && (
          <p className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" /> Verificando este aparelho...
          </p>
        )}

        {push.state === "enabled" && (
          <div className="space-y-3">
            <p className="flex items-center gap-2 text-sm font-medium text-emerald-700">
              <BellRing className="h-4 w-4" /> Push ativado neste aparelho
            </p>
            <div className="flex flex-wrap gap-2">
              <Button size="sm" variant="outline" disabled={push.testing} onClick={() => void testNotification()}>
                {push.testing ? "Enviando..." : "Testar push"}
              </Button>
              <Button size="sm" variant="ghost" onClick={() => void push.disable()}>
                Desativar
              </Button>
            </div>
          </div>
        )}

        {push.state === "disabled" && (
          <div className="flex items-center justify-between gap-3">
            <p className="flex items-center gap-2 text-sm"><Smartphone className="h-4 w-4" /> Receber no celular</p>
            <Button size="sm" onClick={() => void push.enable()}>Ativar push</Button>
          </div>
        )}

        {push.state === "needs-install" && (
          <p className="text-sm text-muted-foreground">
            No iPhone, abra o site no Safari, escolha Compartilhar → Adicionar à Tela de Início e
            entre no SIGA pelo ícone para ativar as notificações.
          </p>
        )}

        {push.state === "blocked" && (
          <p className="flex gap-2 text-sm text-amber-700">
            <CircleAlert className="mt-0.5 h-4 w-4 shrink-0" />
            Autorize notificações do SIGA nas configurações do celular.
          </p>
        )}

        {(push.state === "error" || push.state === "unsupported") && (
          <p className="flex gap-2 text-sm text-amber-700">
            <CircleAlert className="mt-0.5 h-4 w-4 shrink-0" />
            {push.errorMessage || "Este navegador não oferece suporte a Web Push."}
          </p>
        )}

        {feedback && <p role="status" className="text-xs text-muted-foreground">{feedback}</p>}
      </PopoverContent>
    </Popover>
  )
}
