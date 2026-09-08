"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { getBrowserClient } from "@/lib/supabase/client"

type NotificationRole = "admin" | "coach"

export interface SigaNotification {
  id: string
  title: string
  message: string
  href: string
  actionLabel: string
  kind: "info" | "warning" | "summary" | "attendance"
  details?: string[]
}

interface UseNotificationsArgs {
  userId?: string
  role?: NotificationRole
}

interface SaoPauloNow {
  year: number
  month: number
  day: number
  hour: number
  minute: number
  weekday: number // 0 domingo ... 6 sábado
  dateString: string
  monthName: string
  weekdayName: string
}

const MONTHS = [
  "janeiro", "fevereiro", "março", "abril", "maio", "junho",
  "julho", "agosto", "setembro", "outubro", "novembro", "dezembro",
]

const WEEKDAYS = ["domingo", "segunda", "terça", "quarta", "quinta", "sexta", "sábado"]

function getSaoPauloNow(): SaoPauloNow {
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
  const year = Number(parts.year)
  const month = Number(parts.month)
  const day = Number(parts.day)
  const hour = Number(parts.hour)
  const minute = Number(parts.minute)
  const weekdayMap: Record<string, number> = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 }
  const weekday = weekdayMap[parts.weekday] ?? new Date().getDay()

  return {
    year,
    month,
    day,
    hour,
    minute,
    weekday,
    dateString: `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`,
    monthName: MONTHS[month - 1],
    weekdayName: WEEKDAYS[weekday],
  }
}

function isLastDayOfMonth(now: SaoPauloNow) {
  return now.day === new Date(Date.UTC(now.year, now.month, 0)).getUTCDate()
}

function minutesSinceMidnight(now: SaoPauloNow) {
  return now.hour * 60 + now.minute
}

function readIdsKey(userId: string) {
  return `siga:notifications:read:${userId}`
}

function loadReadIds(userId?: string): Set<string> {
  if (!userId || typeof window === "undefined") return new Set()
  try {
    const raw = window.localStorage.getItem(readIdsKey(userId))
    return new Set(raw ? JSON.parse(raw) : [])
  } catch {
    return new Set()
  }
}

export function useNotifications({ userId, role }: UseNotificationsArgs) {
  const supabase = getBrowserClient()
  const [now, setNow] = useState<SaoPauloNow>(() => getSaoPauloNow())
  const [dynamicNotifications, setDynamicNotifications] = useState<SigaNotification[]>([])
  const [readIds, setReadIds] = useState<Set<string>>(() => loadReadIds(userId))
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    setReadIds(loadReadIds(userId))
  }, [userId])

  useEffect(() => {
    const refreshClock = () => setNow(getSaoPauloNow())
    refreshClock()
    const interval = window.setInterval(refreshClock, 30_000)
    return () => window.clearInterval(interval)
  }, [])

  const staticNotifications = useMemo<SigaNotification[]>(() => {
    if (!role) return []
    const items: SigaNotification[] = []

    if (role === "admin") {
      if (now.day === 1) {
        items.push({
          id: `admin-month-start-${now.year}-${now.month}`,
          title: `Chegamos em ${now.monthName}!`,
          message: "Envie a mensagem de abertura da mensalidade nos grupos da escolinha.",
          href: "/payments",
          actionLabel: "Ir para pagamentos",
          kind: "info",
        })
      }

      if (now.day === 10) {
        items.push({
          id: `admin-due-date-${now.year}-${now.month}`,
          title: "Hoje é dia de vencimento",
          message: `As mensalidades de ${now.monthName} vencem hoje. Envie o lembrete de vencimento nos grupos.`,
          href: "/payments",
          actionLabel: "Ver mensalidades",
          kind: "warning",
        })
      }
    }

    return items
  }, [now, role])

  const loadDynamicNotifications = useCallback(async () => {
    if (!role || !userId) {
      setDynamicNotifications([])
      return
    }

    setIsLoading(true)
    try {
      if (role === "admin") {
        const postponedResult = await supabase
          .from("payments")
          .select("id,student_id,month,postponed_to")
          .eq("status", "Adiado")
          .gte("postponed_to", `${now.dateString}T00:00:00`)
          .lt("postponed_to", `${now.dateString}T23:59:59.999`)

        if (postponedResult.error) throw postponedResult.error

        const postponedPayments = postponedResult.data || []
        const postponedStudentIds = Array.from(new Set(postponedPayments.map((payment: any) => payment.student_id)))
        let studentById = new Map<string, any>()

        if (postponedStudentIds.length) {
          const studentsResult = await supabase
            .from("students")
            .select("id,name,responsible")
            .in("id", postponedStudentIds)
          if (studentsResult.error) throw studentsResult.error
          studentById = new Map((studentsResult.data || []).map((student: any) => [student.id, student]))
        }

        const items: SigaNotification[] = postponedPayments.map((payment: any) => {
          const student = studentById.get(payment.student_id)
          const studentName = student?.name || "Aluno não identificado"
          const responsibleName = student?.responsible || "Responsável não informado"
          return {
            id: `admin-postponed-due-${payment.id}-${now.dateString}`,
            title: "Mensalidade adiada vence hoje",
            message: `${studentName} — responsável: ${responsibleName}. A mensalidade ${payment.month ? `de ${payment.month}` : "adiada"} vence hoje.`,
            href: "/payments",
            actionLabel: "Ver mensalidade",
            kind: "warning" as const,
            details: [`Aluno: ${studentName}`, `Responsável: ${responsibleName}`],
          }
        })

        if (isLastDayOfMonth(now)) {
          const [paymentsResult, studentsResult] = await Promise.all([
            supabase
              .from("payments")
              .select("student_id,status")
              .eq("month_number", now.month)
              .eq("year_number", now.year),
            supabase
              .from("students")
              .select("id,name,registration_date,created_at")
              .order("name", { ascending: true }),
          ])

          if (paymentsResult.error) throw paymentsResult.error
          if (studentsResult.error) throw studentsResult.error

          const pendingStatuses = new Set(["Em Aberto", "Não Pagou", "Cobrado", "Adiado", "Novo"])
          const pendingStudentIds = new Set(
            (paymentsResult.data || [])
              .filter((payment: any) => pendingStatuses.has(payment.status))
              .map((payment: any) => payment.student_id),
          )

          const monthPrefix = `${now.year}-${String(now.month).padStart(2, "0")}`
          const newStudents = (studentsResult.data || []).filter((student: any) => {
            const enteredAt = student.registration_date || student.created_at || ""
            return String(enteredAt).startsWith(monthPrefix)
          })

          items.push({
            id: `admin-month-close-${now.year}-${now.month}`,
            title: `Fechamento de ${now.monthName}`,
            message: `Chegou o último dia do mês: ${pendingStudentIds.size} pendência${pendingStudentIds.size === 1 ? "" : "s"} e ${newStudents.length} aluno${newStudents.length === 1 ? " novo" : "s novos"}.`,
            href: "/payments",
            actionLabel: "Abrir pagamentos",
            kind: "summary",
            details: newStudents.length
              ? ["Alunos novos do mês:", ...newStudents.map((student: any) => student.name)]
              : ["Nenhum aluno novo cadastrado neste mês."],
          })
        }

        setDynamicNotifications(items)
        return
      }

      if (role === "coach" && now.weekday >= 1 && now.weekday <= 5) {
        const currentMinutes = minutesSinceMidnight(now)
        if (currentMinutes < 18 * 60) {
          setDynamicNotifications([])
          return
        }

        const { data, error } = await supabase
          .from("attendance")
          .select("class_schedule")
          .eq("date", now.dateString)

        if (error) throw error
        const completedSchedules = new Set((data || []).map((item: any) => item.class_schedule))
        const items: SigaNotification[] = []

        if (currentMinutes >= 18 * 60 && !completedSchedules.has("18:00-19:30")) {
          items.push({
            id: `coach-first-call-${now.dateString}`,
            title: "Chamada do 1º horário",
            message: `Não esqueça de fazer a chamada de ${now.weekdayName} do primeiro horário.`,
            href: "/trainer/chamada",
            actionLabel: "Fazer chamada",
            kind: "attendance",
          })
        }

        if (currentMinutes >= 19 * 60 + 40 && !completedSchedules.has("19:30-21:00")) {
          items.push({
            id: `coach-second-call-${now.dateString}`,
            title: "Chamada do 2º horário",
            message: `Não esqueça de fazer a chamada de ${now.weekdayName} do segundo horário.`,
            href: "/trainer/chamada",
            actionLabel: "Fazer chamada",
            kind: "attendance",
          })
        }

        setDynamicNotifications(items)
        return
      }

      setDynamicNotifications([])
    } catch (error) {
      console.error("[SIGA] Erro ao carregar notificações:", error)
      setDynamicNotifications([])
    } finally {
      setIsLoading(false)
    }
  }, [now, role, supabase, userId])

  useEffect(() => {
    void loadDynamicNotifications()
  }, [loadDynamicNotifications])

  // A chamada pode ser registrada em outra tela/aba. Atualize os lembretes
  // periodicamente sem recarregar o restante do sistema.
  useEffect(() => {
    if (role !== "coach") return
    const interval = window.setInterval(() => void loadDynamicNotifications(), 60_000)
    return () => window.clearInterval(interval)
  }, [loadDynamicNotifications, role])

  const notifications = useMemo(
    () => [...staticNotifications, ...dynamicNotifications],
    [staticNotifications, dynamicNotifications],
  )

  const unreadCount = notifications.filter((notification) => !readIds.has(notification.id)).length

  const persistReadIds = useCallback((next: Set<string>) => {
    setReadIds(next)
    if (!userId || typeof window === "undefined") return
    window.localStorage.setItem(readIdsKey(userId), JSON.stringify(Array.from(next)))
  }, [userId])

  const markAsRead = useCallback((id: string) => {
    const next = new Set(readIds)
    next.add(id)
    persistReadIds(next)
  }, [persistReadIds, readIds])

  const markAllAsRead = useCallback(() => {
    const next = new Set(readIds)
    notifications.forEach((notification) => next.add(notification.id))
    persistReadIds(next)
  }, [notifications, persistReadIds, readIds])

  const isRead = useCallback((id: string) => readIds.has(id), [readIds])

  return {
    notifications,
    unreadCount,
    isLoading,
    isRead,
    markAsRead,
    markAllAsRead,
    refresh: loadDynamicNotifications,
  }
}
