"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { CheckCircle2, XCircle, Trash2 } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import type { Attendance, Student } from "@/lib/types"
import Image from "next/image"

interface AttendanceEditDialogProps {
  attendance: Attendance
  students: Student[]
  onSave: (records: Record<string, "Presente" | "Ausente">) => void
  onDelete?: () => void
  onClose: () => void
}

export function AttendanceEditDialog({ attendance, students, onSave, onDelete, onClose }: AttendanceEditDialogProps) {
  const [records, setRecords] = useState<Record<string, "Presente" | "Ausente">>(
    Object.fromEntries(attendance.records.map((r) => [r.studentId, r.status])),
  )

  const handleToggle = (studentId: string) => {
    setRecords((prev) => ({
      ...prev,
      [studentId]: prev[studentId] === "Presente" ? "Ausente" : "Presente",
    }))
  }

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Editar Registro de Chamada</DialogTitle>
          <DialogDescription>
            {attendance.classSchedule} - {attendance.dayOfWeek}
            <br />
            <span className="text-xs">Treinador: {attendance.trainerName}</span>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          {attendance.records.map((record) => {
            const student = students.find((s) => s.id === record.studentId)
            const status = records[record.studentId]
            const isPresent = status === "Presente"

            return (
              <div
                key={record.studentId}
                onClick={() => handleToggle(record.studentId)}
                className={`flex items-center gap-4 p-4 rounded-lg border-2 cursor-pointer transition-all ${
                  isPresent
                    ? "border-green-500 bg-green-50 dark:bg-green-950"
                    : "border-red-500 bg-red-50 dark:bg-red-950"
                }`}
              >
                <div className="relative h-16 w-16 rounded-full overflow-hidden bg-primary/10 border-2 border-primary/20 flex-shrink-0">
                  <Image
                    src={student?.photo || "/placeholder.svg?height=64&width=64&query=student"}
                    alt={student?.name || "Student"}
                    fill
                    className="object-cover"
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-foreground">{student?.name}</p>
                </div>
                <Badge className={isPresent ? "bg-green-600 hover:bg-green-700" : "bg-red-600 hover:bg-red-700"}>
                  {isPresent ? (
                    <>
                      <CheckCircle2 className="h-3 w-3 mr-1" />
                      Presente
                    </>
                  ) : (
                    <>
                      <XCircle className="h-3 w-3 mr-1" />
                      Ausente
                    </>
                  )}
                </Badge>
              </div>
            )
          })}
        </div>

        <DialogFooter className="mt-6 flex gap-2 justify-between sm:justify-end">
          <div className="flex-1 sm:flex-none">
            {onDelete && (
              <Button variant="destructive" onClick={onDelete} className="w-full sm:w-auto">
                <Trash2 className="h-4 w-4 mr-2" />
                Apagar Registro
              </Button>
            )}
          </div>
          <div className="flex gap-2 w-full sm:w-auto">
            <Button variant="outline" onClick={onClose} className="flex-1 sm:flex-none bg-transparent">
              Cancelar
            </Button>
            <Button
              onClick={() => {
                onSave(records)
              }}
              className="flex-1 sm:flex-none"
            >
              Salvar Alterações
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
