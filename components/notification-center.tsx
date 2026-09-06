"use client"

import { useEffect, useRef } from "react"
import Link from "next/link"
import { Bell, BellRing, CalendarClock, CheckCheck, CircleAlert, ClipboardCheck, Loader2, Smartphone, UsersRound } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { ScrollArea } from "@/components/ui/scroll-area"
import { cn } from "@/lib/utils"
import { useNotifications, type SigaNotification } from "@/lib/hooks/use-notifications"
import { usePushNotifications } from "@/lib/hooks/use-push-notifications"

interface NotificationCenterProps {
  user: {
    id: string
    role: "admin" | "coach"
  }
}

function iconFor(notification: SigaNotification) {
  if (notification.kind === "attendance") return ClipboardCheck
  if (notification.kind === "warning") return CircleAlert
  if (notification.kind === "summary") return UsersRound
  return CalendarClock
}

export function NotificationCenter({ user }: NotificationCenterProps) {
  const {
    notifications,
    unreadCount,
    isRead,
    markAsRead,
    markAllAsRead,
  } = useNotifications({ userId: user.id, role: user.role })
  const notifiedThisMount = useRef(new Set<string>())
  const push = usePushNotifications()

  useEffect(() => {
    for (const notification of notifications) {
      if (isRead(notification.id) || notifiedThisMount.current.has(notification.id)) continue
      notifiedThisMount.current.add(notification.id)
      toast(notification.title, {
        description: notification.message,
        duration: 7000,
      })
    }
  }, [isRead, notifications])

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="relative h-9 w-9 px-0 text-white hover:bg-white/10"
          aria-label={`Notificações${unreadCount ? `, ${unreadCount} não lidas` : ""}`}
        >
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute -right-0.5 -top-0.5 flex min-h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold leading-none text-white ring-2 ring-[#0a1628]">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>

      <PopoverContent align="end" className="w-[calc(100vw-24px)] max-w-[390px] p-0 shadow-xl">
        <div className="flex items-center justify-between border-b px-4 py-3">
          <div>
            <p className="font-semibold">Notificações</p>
            <p className="text-xs text-muted-foreground">
              {user.role === "admin" ? "Avisos administrativos" : "Lembretes de chamada"}
            </p>
          </div>
          {unreadCount > 0 && (
            <Button variant="ghost" size="sm" className="h-8 gap-1.5 px-2 text-xs" onClick={markAllAsRead}>
              <CheckCheck className="h-3.5 w-3.5" />
              Marcar lidas
            </Button>
          )}
        </div>

        <div className="border-b bg-slate-50/70 px-4 py-3">
          {push.state === "loading" && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Verificando notificações do aparelho...
            </div>
          )}

          {push.state === "enabled" && (
            <div className="flex items-center justify-between gap-3">
              <div className="flex min-w-0 items-center gap-2">
                <div className="rounded-full bg-emerald-100 p-1.5">
                  <BellRing className="h-4 w-4 text-emerald-700" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-emerald-800">Push ativado neste aparelho</p>
                  <p className="text-[11px] text-muted-foreground">Os lembretes podem chegar mesmo com o SIGA fechado.</p>
                </div>
              </div>
              <div className="flex shrink-0 items-center gap-1">
                <Button
                  variant="outline"
                  size="sm"
                  className="h-7 px-2 text-[11px]"
                  disabled={push.testing}
                  onClick={() => void push.test().then((ok) => {
                    if (ok) {
                      toast.success("Push de teste enviado", { description: "A notificação deve aparecer neste aparelho em instantes." })
                    } else {
                      toast.error("Falha no teste de push", { description: "Confira a configuração do aparelho e tente novamente." })
                    }
                  })}
                >
                  {push.testing ? <Loader2 className="h-3 w-3 animate-spin" /> : "Testar"}
                </Button>
                <Button variant="ghost" size="sm" className="h-7 px-2 text-[11px]" onClick={() => void push.disable()}>
                  Desativar
                </Button>
              </div>
            </div>
          )}

          {push.state === "disabled" && (
            <div className="flex items-center justify-between gap-3">
              <div className="flex min-w-0 items-center gap-2">
                <Smartphone className="h-4 w-4 shrink-0 text-[#0a1628]" />
                <div>
                  <p className="text-xs font-semibold">Receber no celular</p>
                  <p className="text-[11px] text-muted-foreground">Ative push, som/vibração e tela bloqueada conforme o aparelho permitir.</p>
                </div>
              </div>
              <Button size="sm" className="h-8 shrink-0 text-xs" onClick={() => void push.enable()}>
                Ativar
              </Button>
            </div>
          )}

          {push.state === "needs-install" && (
            <div className="flex gap-2">
              <Smartphone className="mt-0.5 h-4 w-4 shrink-0 text-[#0a1628]" />
              <div>
                <p className="text-xs font-semibold">Ative como app no iPhone</p>
                <p className="mt-0.5 text-[11px] leading-relaxed text-muted-foreground">No iPhone/iPad, use Compartilhar → Adicionar à Tela de Início, abra o SIGA pelo ícone e toque novamente em Ativar.</p>
              </div>
            </div>
          )}

          {push.state === "blocked" && (
            <div className="flex gap-2 text-xs">
              <CircleAlert className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
              <div>
                <p className="font-semibold">Notificações bloqueadas</p>
                <p className="text-[11px] text-muted-foreground">Libere as notificações do SIGA nas configurações do navegador/aparelho e recarregue a página.</p>
              </div>
            </div>
          )}

          {(push.state === "error" || push.state === "unsupported") && (
            <div className="flex gap-2 text-xs">
              <CircleAlert className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
              <div>
                <p className="font-semibold">Push indisponível neste momento</p>
                <p className="text-[11px] text-muted-foreground">{push.errorMessage || "Este navegador não oferece suporte a Web Push."}</p>
              </div>
            </div>
          )}
        </div>

        <ScrollArea className="max-h-[58vh]">
          {notifications.length === 0 ? (
            <div className="flex flex-col items-center px-6 py-10 text-center">
              <div className="mb-3 rounded-full bg-muted p-3">
                <Bell className="h-5 w-5 text-muted-foreground" />
              </div>
              <p className="text-sm font-medium">Tudo em dia</p>
              <p className="mt-1 text-xs text-muted-foreground">Nenhuma notificação para este momento.</p>
            </div>
          ) : (
            <div className="divide-y">
              {notifications.map((notification) => {
                const Icon = iconFor(notification)
                const read = isRead(notification.id)
                return (
                  <div
                    key={notification.id}
                    className={cn("relative px-4 py-4", !read && "bg-blue-50/60")}
                  >
                    {!read && <span className="absolute right-3 top-4 h-2 w-2 rounded-full bg-blue-600" />}
                    <div className="flex gap-3 pr-3">
                      <div className="mt-0.5 rounded-full bg-[#0a1628]/5 p-2">
                        <Icon className="h-4 w-4 text-[#0a1628]" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold leading-snug">{notification.title}</p>
                        <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{notification.message}</p>

                        {notification.details && notification.details.length > 0 && (
                          <div className="mt-2 rounded-md border bg-background px-3 py-2">
                            {notification.details.map((detail, index) => (
                              <p key={`${notification.id}-detail-${index}`} className={cn("text-xs", index === 0 && "font-semibold")}>
                                {detail}
                              </p>
                            ))}
                          </div>
                        )}

                        <div className="mt-3 flex items-center gap-2">
                          <Button asChild size="sm" className="h-8 text-xs" onClick={() => markAsRead(notification.id)}>
                            <Link href={notification.href}>{notification.actionLabel}</Link>
                          </Button>
                          {!read && (
                            <Button variant="ghost" size="sm" className="h-8 text-xs" onClick={() => markAsRead(notification.id)}>
                              Marcar como lida
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  )
}
