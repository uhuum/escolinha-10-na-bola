"use client"

import { useMemo, useState } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { CheckCircle2, XCircle, Trash2, Users } from "lucide-react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
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

  const studentById = useMemo(() => new Map(students.map((student) => [student.id, student])), [students])
  const presentCount = Object.values(records).filter((status) => status === "Presente").length
  const absentCount = Object.values(records).filter((status) => status === "Ausente").length

  const handleToggle = (studentId: string) => {
    if (saving || deleting) return
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
    if (!onDelete || !window.confirm("Apagar esta chamada? Essa ação não pode ser desfeita.")) return
    try {
      setDeleting(true)
      await onDelete()
    } finally {
      setDeleting(false)
    }
  }

  return (
    <Dialog open onOpenChange={(open) => !open && !saving && !deleting && onClose()}>
      <DialogContent className="flex h-[min(88dvh,760px)] w-[calc(100vw-1rem)] max-w-xl grid-rows-[auto_auto_minmax(0,1fr)_auto] gap-0 overflow-hidden rounded-2xl p-0 sm:h-[min(86vh,760px)] sm:w-full">
        <DialogHeader className="border-b px-4 pb-3 pt-4 pr-12 text-left sm:px-5 sm:pt-5">
          <DialogTitle className="text-lg sm:text-xl">Editar chamada</DialogTitle>
          <DialogDescription className="mt-1 text-xs sm:text-sm">
            {attendance.dayOfWeek} • {attendance.classSchedule} • {attendance.trainerName}
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-3 gap-2 border-b bg-muted/20 px-3 py-2.5 sm:px-5">
          <div className="rounded-lg bg-background p-2 text-center shadow-sm">
            <div className="flex items-center justify-center gap-1 text-base font-bold text-primary"><Users className="h-4 w-4" />{attendance.records.length}</div>
            <p className="text-[10px] text-muted-foreground">Total</p>
          </div>
          <div className="rounded-lg bg-green-50 p-2 text-center dark:bg-green-950/40">
            <p className="text-base font-bold text-green-600">{presentCount}</p><p className="text-[10px] text-muted-foreground">Presentes</p>
          </div>
          <div className="rounded-lg bg-red-50 p-2 text-center dark:bg-red-950/40">
            <p className="text-base font-bold text-red-600">{absentCount}</p><p className="text-[10px] text-muted-foreground">Ausentes</p>
          </div>
        </div>

        <div className="min-h-0 overflow-y-auto overscroll-contain px-3 py-3 sm:px-5">
          <div className="space-y-2">
            {attendance.records.map((record) => {
              const student = studentById.get(record.studentId)
              const isPresent = records[record.studentId] === "Presente"
              return (
                <button
                  type="button"
                  key={record.studentId}
                  onClick={() => handleToggle(record.studentId)}
                  className={`flex w-full items-center gap-3 rounded-xl border p-2.5 text-left transition active:scale-[.995] sm:p-3 ${isPresent ? "border-green-300 bg-green-50/70 dark:bg-green-950/30" : "border-red-300 bg-red-50/70 dark:bg-red-950/30"}`}
                >
                  <div className="relative h-11 w-11 shrink-0 overflow-hidden rounded-full border bg-muted sm:h-12 sm:w-12">
                    <Image src={student?.photo || "/placeholder.svg?height=48&width=48&query=student"} alt={student?.name || "Aluno"} fill className="object-cover" />
                  </div>
                  <p className="min-w-0 flex-1 truncate text-sm font-semibold sm:text-base">{student?.name || "Aluno não encontrado"}</p>
                  <Badge className={`shrink-0 px-2 py-1 text-[11px] ${isPresent ? "bg-green-600 hover:bg-green-600" : "bg-red-600 hover:bg-red-600"}`}>
                    {isPresent ? <CheckCircle2 className="mr-1 h-3.5 w-3.5" /> : <XCircle className="mr-1 h-3.5 w-3.5" />}
                    <span className="hidden min-[390px]:inline">{isPresent ? "Presente" : "Ausente"}</span>
                  </Badge>
                </button>
              )
            })}
          </div>
        </div>

        <div className="border-t bg-background p-3 sm:p-4">
          <div className="grid grid-cols-2 gap-2">
            <Button variant="outline" onClick={onClose} disabled={saving || deleting}>Cancelar</Button>
            <Button onClick={handleSave} disabled={saving || deleting}>{saving ? "Salvando..." : "Salvar"}</Button>
          </div>
          {onDelete && (
            <Button variant="ghost" onClick={handleDelete} disabled={saving || deleting} className="mt-2 w-full text-destructive hover:bg-destructive/10 hover:text-destructive">
              <Trash2 className="mr-2 h-4 w-4" />{deleting ? "Apagando..." : "Apagar registro"}
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
