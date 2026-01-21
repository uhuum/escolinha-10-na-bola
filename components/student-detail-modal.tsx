"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import Image from "next/image"
import type { Student } from "@/lib/types"
import { useAttendance } from "@/lib/hooks/use-attendance"

interface StudentDetailModalProps {
  student: Student | null
  isOpen: boolean
  onClose: () => void
}

export function StudentDetailModal({ student, isOpen, onClose }: StudentDetailModalProps) {
  const { attendances } = useAttendance()

  if (!student) return null

  // Calculate attendance percentage
  const studentAttendances = attendances.filter((att) => att.records.some((r) => r.studentId === student.id))
  const presentCount = studentAttendances.reduce((sum, att) => {
    const record = att.records.find((r) => r.studentId === student.id)
    return sum + (record?.status === "Presente" ? 1 : 0)
  }, 0)
  const absentCount = studentAttendances.reduce((sum, att) => {
    const record = att.records.find((r) => r.studentId === student.id)
    return sum + (record?.status === "Ausente" ? 1 : 0)
  }, 0)
  const totalRecords = studentAttendances.length
  const attendancePercentage = totalRecords > 0 ? Math.round((presentCount / totalRecords) * 100) : 0

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md sm:max-w-lg border-2 max-h-[90vh] overflow-y-auto p-4 sm:p-6">
        <DialogHeader className="pb-3 sm:pb-4 border-b">
          <DialogTitle className="text-xl sm:text-2xl">Detalhes do Aluno</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 sm:space-y-6">
          <div className="flex justify-center">
            <div className="relative h-32 w-32 sm:h-40 sm:w-40 rounded-2xl overflow-hidden border-4 border-primary/20 bg-primary/10 flex-shrink-0">
              <Image
                src={student.photo || "/placeholder.svg?height=160&width=160&query=student+profile"}
                alt={student.name}
                fill
                className="object-cover"
              />
            </div>
          </div>

          <div className="text-center">
            <h2 className="text-xl sm:text-2xl font-bold text-foreground mb-1 sm:mb-2 break-words">{student.name}</h2>
            <p className="text-sm sm:text-base text-muted-foreground break-words">{student.responsible}</p>
          </div>

          <div className="grid grid-cols-2 gap-2 sm:gap-3">
            <Card className="border-2 bg-primary/5">
              <CardContent className="pt-3 sm:pt-4 p-3">
                <div className="text-center">
                  <p className="text-xs sm:text-sm text-muted-foreground mb-1">Turma & Horário</p>
                  <p className="font-bold text-foreground text-xs sm:text-sm break-words">{student.classSchedule}</p>
                  <p className="text-xs text-muted-foreground mt-1">{student.classDays?.join(", ")}</p>
                </div>
              </CardContent>
            </Card>

            <Card className="border-2 bg-accent/5">
              <CardContent className="pt-3 sm:pt-4 p-3">
                <div className="text-center">
                  <p className="text-xs sm:text-sm text-muted-foreground mb-1">Idade</p>
                  <p className="font-bold text-foreground text-xs sm:text-sm">
                    {student.birthDate ? new Date().getFullYear() - new Date(student.birthDate).getFullYear() : "N/A"}{" "}
                    anos
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">{student.birthDate}</p>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card className="border-2">
            <CardContent className="pt-3 sm:pt-6 p-3 sm:p-6">
              <div className="space-y-2 sm:space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-foreground text-sm sm:text-base">Frequência</span>
                  <span className="text-xl sm:text-2xl font-bold text-primary">{attendancePercentage}%</span>
                </div>
                <div className="flex gap-1 sm:gap-2">
                  <div className="flex-1">
                    <p className="text-xs text-muted-foreground mb-1">Presentes</p>
                    <p className="text-base sm:text-lg font-bold text-green-600">{presentCount}</p>
                  </div>
                  <div className="flex-1">
                    <p className="text-xs text-muted-foreground mb-1">Ausentes</p>
                    <p className="text-base sm:text-lg font-bold text-red-600">{absentCount}</p>
                  </div>
                  <div className="flex-1">
                    <p className="text-xs text-muted-foreground mb-1">Total</p>
                    <p className="text-base sm:text-lg font-bold text-muted-foreground">{totalRecords}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-2">
            <CardContent className="pt-3 sm:pt-6 p-3 sm:p-6">
              <div className="space-y-1 sm:space-y-2 text-xs sm:text-sm">
                <div>
                  <p className="text-muted-foreground">RG</p>
                  <p className="font-medium truncate">{student.rg || "N/A"}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">CPF do Responsável</p>
                  <p className="font-medium truncate">{student.responsibleCpf || "N/A"}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Email do Responsável</p>
                  <p className="font-medium truncate">{student.responsibleEmail || "N/A"}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Telefone (Pai)</p>
                  <p className="font-medium truncate">{student.fatherPhone || "N/A"}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Telefone (Mãe)</p>
                  <p className="font-medium truncate">{student.motherPhone || "N/A"}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="flex items-center justify-between gap-2 pb-2">
            <span className="font-semibold text-foreground text-sm sm:text-base">Status</span>
            <Badge className={student.isActive ? "bg-green-600 hover:bg-green-700 text-xs sm:text-sm" : "bg-gray-600 hover:bg-gray-700 text-xs sm:text-sm"}>
              {student.isActive ? "Ativo" : "Inativo"}
            </Badge>
          </div>

          <Button onClick={onClose} className="w-full" size="sm" sm-size="lg">
            Fechar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
