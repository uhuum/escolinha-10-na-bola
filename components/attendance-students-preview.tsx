"use client"

import { useEffect } from "react"
import { X, Pencil, Users } from "lucide-react"
import type { Attendance, Student } from "@/lib/types"

type Props = {
  attendance: Attendance
  students: Student[]
  onClose: () => void
  onEdit?: () => void
}

export function AttendanceStudentsPreview({ attendance, students, onClose, onEdit }: Props) {
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => { if (event.key === "Escape") onClose() }
    window.addEventListener("keydown", handleEscape)
    return () => window.removeEventListener("keydown", handleEscape)
  }, [onClose])

  const studentById = new Map(students.map((student) => [student.id, student]))
  const present = attendance.records.filter((record) => record.status === "Presente").length
  const absent = attendance.records.filter((record) => record.status === "Ausente").length

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-3 sm:p-6" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose() }}>
      <section role="dialog" aria-modal="true" aria-labelledby="attendance-preview-title" className="flex max-h-[85dvh] w-full max-w-lg flex-col overflow-hidden rounded-2xl border bg-background shadow-2xl">
        <header className="flex shrink-0 items-start justify-between gap-3 border-b p-4">
          <div className="min-w-0"><h2 id="attendance-preview-title" className="text-lg font-bold">Alunos da chamada</h2><p className="text-sm text-muted-foreground">{new Date(`${attendance.date}T12:00:00`).toLocaleDateString("pt-BR")} · {attendance.classSchedule.replace("-", " às ")}</p><p className="mt-1 text-xs text-muted-foreground">{present} presentes · {absent} ausentes</p></div>
          <button type="button" aria-label="Fechar chamada" onClick={onClose} className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border hover:bg-muted"><X className="h-5 w-5" /></button>
        </header>
        <div className="min-h-0 flex-1 space-y-2 overflow-y-auto p-4">
          {attendance.records.length === 0 && <p className="py-8 text-center text-sm text-muted-foreground">Nenhum aluno registrado nesta chamada.</p>}
          {attendance.records.map((record) => {
            const student = studentById.get(record.studentId)
            const name = student?.name || "Aluno não encontrado"
            return <div key={record.studentId} className="flex min-w-0 items-center gap-3 rounded-xl border p-2.5">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-full bg-muted text-sm font-semibold" aria-label={`Foto de ${name}`}>
                {student?.photo ? <img src={student.photo} alt={name} className="h-full w-full object-cover" /> : <span aria-hidden="true">{name.split(/\s+/).slice(0, 2).map((part) => part[0]).join("").toUpperCase()}</span>}
              </div>
              <span className="min-w-0 flex-1 break-words text-sm font-medium">{name}</span>
              <span className={`shrink-0 rounded-full px-2 py-1 text-[11px] font-semibold ${record.status === "Presente" ? "bg-emerald-100 text-emerald-800" : "bg-rose-100 text-rose-800"}`}>{record.status}</span>
            </div>
          })}
        </div>
        <footer className="flex shrink-0 items-center justify-between gap-2 border-t p-4"><span className="flex items-center gap-1 text-xs text-muted-foreground"><Users className="h-4 w-4" />{attendance.records.length} alunos</span><div className="flex gap-2">{onEdit && <button type="button" onClick={onEdit} className="flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-semibold hover:bg-muted"><Pencil className="h-4 w-4" />Editar</button>}<button type="button" onClick={onClose} className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground">Fechar</button></div></footer>
      </section>
    </div>
  )
}
