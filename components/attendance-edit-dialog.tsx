"use client"

import { useMemo, useState } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { CheckCircle2, XCircle, Trash2, Users, X } from "lucide-react"
import type { Attendance, Student } from "@/lib/types"
import Image from "next/image"

interface AttendanceEditDialogProps {
  attendance: Attendance
  students: Student[]
  onSave: (records: Record<string, "Presente" | "Ausente">) => Promise<void> | void
  onDelete?: () => Promise<void> | void
  onClose: () => void
}

export function AttendanceEditDialog({ attendance, students, onSave, onDelete, onClose }: AttendanceEditDialogProps) {
  const [records, setRecords] = useState<Record<string, "Presente" | "Ausente">>(
    Object.fromEntries(attendance.records.map((r) => [r.studentId, r.status])),
  )
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false)

  const studentById = useMemo(() => new Map(students.map((student) => [student.id, student])), [students])
  const presentCount = Object.values(records).filter((status) => status === "Presente").length
  const absentCount = Object.values(records).filter((status) => status === "Ausente").length
  const busy = saving || deleting

  const handleToggle = (studentId: string) => {
    if (busy) return
    setRecords((prev) => ({ ...prev, [studentId]: prev[studentId] === "Presente" ? "Ausente" : "Presente" }))
  }

  const handleSave = async () => {
    try {
      setSaving(true)
      await onSave(records)
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!onDelete) return
    try {
      setDeleting(true)
      await onDelete()
      setConfirmDeleteOpen(false)
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-end justify-center bg-black/60 backdrop-blur-[1px] sm:items-center sm:p-4">
      <section
        role="dialog"
        aria-modal="true"
        aria-label="Editar chamada"
        className="flex h-[92dvh] w-full max-w-xl flex-col overflow-hidden rounded-t-3xl border bg-background shadow-2xl sm:h-[min(86dvh,760px)] sm:rounded-2xl"
      >
        <header className="relative shrink-0 border-b bg-background px-4 py-4 pr-12 sm:px-5">
          <h2 className="text-xl font-bold leading-tight">Editar chamada</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {attendance.dayOfWeek} • {attendance.classSchedule} • {attendance.trainerName}
          </p>
          <button
            type="button"
            onClick={onClose}
            disabled={busy}
            className="absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-full text-muted-foreground hover:bg-muted disabled:opacity-50"
            aria-label="Fechar"
          >
            <X className="h-5 w-5" />
          </button>
        </header>

        <div className="grid shrink-0 grid-cols-3 gap-2 border-b bg-background px-3 py-3 sm:px-5">
          <div className="rounded-xl bg-muted p-2.5 text-center">
            <div className="flex items-center justify-center gap-1 text-lg font-bold text-primary">
              <Users className="h-4 w-4" /> {attendance.records.length}
            </div>
            <p className="text-[11px] text-muted-foreground">Total</p>
          </div>
          <div className="rounded-xl bg-green-50 p-2.5 text-center dark:bg-green-950/40">
            <p className="text-lg font-bold text-green-600">{presentCount}</p>
            <p className="text-[11px] text-muted-foreground">Presentes</p>
          </div>
          <div className="rounded-xl bg-red-50 p-2.5 text-center dark:bg-red-950/40">
            <p className="text-lg font-bold text-red-600">{absentCount}</p>
            <p className="text-[11px] text-muted-foreground">Ausentes</p>
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-3 py-3 sm:px-5">
          <div className="space-y-2">
            {attendance.records.map((record) => {
              const student = studentById.get(record.studentId)
              const isPresent = records[record.studentId] === "Presente"
              return (
                <button
                  type="button"
                  key={record.studentId}
                  onClick={() => handleToggle(record.studentId)}
                  disabled={busy}
                  className={`flex w-full items-center gap-3 rounded-2xl border p-2.5 text-left transition active:scale-[.995] disabled:opacity-70 ${
                    isPresent
                      ? "border-green-400 bg-green-50/80 dark:bg-green-950/30"
                      : "border-red-400 bg-red-50/80 dark:bg-red-950/30"
                  }`}
                >
                  <div className="relative h-11 w-11 shrink-0 overflow-hidden rounded-full border bg-muted">
                    <Image
                      src={student?.photo || "/placeholder.svg?height=48&width=48&query=student"}
                      alt={student?.name || "Aluno"}
                      fill
                      className="object-cover"
                    />
                  </div>
                  <p className="min-w-0 flex-1 text-sm font-semibold leading-snug sm:text-base">
                    {student?.name || "Aluno não encontrado"}
                  </p>
                  <Badge
                    className={`shrink-0 border-0 px-2 py-1 text-[11px] ${
                      isPresent ? "bg-green-600 hover:bg-green-600" : "bg-red-600 hover:bg-red-600"
                    }`}
                  >
                    {isPresent ? <CheckCircle2 className="h-3.5 w-3.5" /> : <XCircle className="h-3.5 w-3.5" />}
                    <span className="ml-1 hidden min-[390px]:inline">{isPresent ? "Presente" : "Ausente"}</span>
                  </Badge>
                </button>
              )
            })}
          </div>
        </div>

        <footer className="shrink-0 border-t bg-background p-3 pb-[max(.75rem,env(safe-area-inset-bottom))] sm:p-4">
          <div className="grid grid-cols-2 gap-2">
            <Button variant="outline" onClick={onClose} disabled={busy}>Cancelar</Button>
            <Button onClick={handleSave} disabled={busy}>{saving ? "Salvando..." : "Salvar"}</Button>
          </div>
          {onDelete && (
            <Button
              variant="ghost"
              onClick={() => setConfirmDeleteOpen(true)}
              disabled={busy}
              className="mt-2 w-full text-destructive hover:bg-destructive/10 hover:text-destructive"
            >
              <Trash2 className="mr-2 h-4 w-4" />
              {deleting ? "Apagando..." : "Apagar registro"}
            </Button>
          )}
        </footer>
      </section>

      <AlertDialog open={confirmDeleteOpen} onOpenChange={(open) => !deleting && setConfirmDeleteOpen(open)}>
        <AlertDialogContent className="max-w-md rounded-2xl p-0 overflow-hidden">
          <div className="border-b bg-destructive/5 px-6 py-5">
            <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-full bg-destructive/10 text-destructive">
              <Trash2 className="h-5 w-5" />
            </div>
            <AlertDialogHeader className="text-left">
              <AlertDialogTitle>Excluir registro de chamada?</AlertDialogTitle>
              <AlertDialogDescription className="leading-relaxed">
                A chamada de <strong className="font-semibold text-foreground">{attendance.dayOfWeek}</strong>, às{` `}
                <strong className="font-semibold text-foreground">{attendance.classSchedule}</strong>, será removida permanentemente.
                As presenças registradas nesta chamada também serão apagadas.
              </AlertDialogDescription>
            </AlertDialogHeader>
          </div>
          <AlertDialogFooter className="grid grid-cols-2 gap-2 px-6 pb-6 sm:grid-cols-2 sm:justify-stretch">
            <AlertDialogCancel disabled={deleting} className="mt-0 w-full">Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={(event) => {
                event.preventDefault()
                void handleDelete()
              }}
              disabled={deleting}
              className="w-full bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleting ? "Excluindo..." : "Sim, excluir"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
