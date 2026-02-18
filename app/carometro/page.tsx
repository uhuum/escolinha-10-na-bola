"use client"

import { useState } from "react"
import { useStudents } from "@/lib/hooks/use-students"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Clock, Search, X } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import type { ClassSchedule, WeekDay } from "@/lib/types"
import type { Student } from "@/lib/types"
import Image from "next/image"
import { AppHeader } from "@/components/app-header"
import { StudentDetailModal } from "@/components/student-detail-modal"
import { LoadingStudents } from "@/components/loading-students"

function calculateAge(birthDate: string): number {
  const birth = new Date(birthDate)
  const today = new Date()
  let age = today.getFullYear() - birth.getFullYear()
  const monthDiff = today.getMonth() - birth.getMonth()
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age--
  }
  return age
}

export default function CarometroPage() {
  const { students, isLoading } = useStudents()
  const [scheduleFilter, setScheduleFilter] = useState<ClassSchedule | "all">("all")
  const [dayFilter, setDayFilter] = useState<WeekDay | "all">("all")
  const [nameFilter, setNameFilter] = useState("")
  const [birthYearFilter, setBirthYearFilter] = useState<string>("all")
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)

  const activeStudents = students.filter((s) => s.isActive)

  const filteredStudents = activeStudents.filter((student) => {
    const matchesName = nameFilter === "" || student.name.toLowerCase().includes(nameFilter.toLowerCase())
    if (!matchesName) return false

    // Filter by birth year
    if (birthYearFilter !== "all") {
      const birthYear = student.birthDate ? new Date(student.birthDate).getFullYear().toString() : ""
      if (birthYear !== birthYearFilter) return false
    }

    if (scheduleFilter === "all" && dayFilter === "all") return true

    if (student.scheduleConfigs && student.scheduleConfigs.length > 0) {
      return student.scheduleConfigs.some((config) => {
        const matchesSchedule = scheduleFilter === "all" || config.schedule === scheduleFilter
        const matchesDay = dayFilter === "all" || config.day === dayFilter
        return matchesSchedule && matchesDay
      })
    }

    const matchesSchedule = scheduleFilter === "all" || student.classSchedule === scheduleFilter
    const matchesDay = dayFilter === "all" || (student.classDays && student.classDays.includes(dayFilter))
    return matchesSchedule && matchesDay
  })

  // Get unique birth years
  const birthYears = Array.from(
    new Set(
      activeStudents
        .filter((s) => s.birthDate)
        .map((s) => new Date(s.birthDate).getFullYear())
        .filter((year) => !isNaN(year))
    )
  ).sort((a, b) => b - a)

  const handleStudentClick = (student: Student) => {
    setSelectedStudent(student)
    setIsModalOpen(true)
  }

  if (isLoading) {
    return <LoadingStudents message="Carregando carômetro..." />
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <AppHeader />

      <main className="container mx-auto px-4 lg:px-8 py-8 lg:py-12 flex-1">
        <div className="mb-8">
          <h2 className="text-4xl font-bold text-foreground mb-3 text-balance">Carômetro</h2>
          <p className="text-lg text-muted-foreground">
            Diretório de alunos por turma - clique em um aluno para ver detalhes
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-8">
          <div className="space-y-2">
            <label className="text-sm font-medium">Horário</label>
            <Select value={scheduleFilter} onValueChange={(value) => setScheduleFilter(value as ClassSchedule | "all")}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os Horários</SelectItem>
                <SelectItem value="18:00-19:30">Primeiro Horário (18:00 - 19:30)</SelectItem>
                <SelectItem value="19:30-21:00">Segundo Horário (19:30 - 21:00)</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Dia da Semana</label>
            <Select value={dayFilter} onValueChange={(value) => setDayFilter(value as WeekDay | "all")}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os Dias</SelectItem>
                <SelectItem value="Segunda">Segunda-feira</SelectItem>
                <SelectItem value="Terça">Terça-feira</SelectItem>
                <SelectItem value="Quarta">Quarta-feira</SelectItem>
                <SelectItem value="Quinta">Quinta-feira</SelectItem>
                <SelectItem value="Sexta">Sexta-feira</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Ano de Nascimento</label>
            <Select value={birthYearFilter} onValueChange={setBirthYearFilter}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os Anos</SelectItem>
                {birthYears.map((year) => (
                  <SelectItem key={year} value={year.toString()}>
                    {year}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Buscar por Nome</label>
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Digite o nome do aluno..."
                value={nameFilter}
                onChange={(e) => setNameFilter(e.target.value)}
                className="pl-9"
              />
              {nameFilter && (
                <button
                  onClick={() => setNameFilter("")}
                  className="absolute right-3 top-3 text-muted-foreground hover:text-foreground"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>
        </div>

        <div className="mb-6">
          <p className="text-sm text-muted-foreground">Mostrando {filteredStudents.length} aluno(s)</p>
        </div>

        <div className="grid gap-6 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {filteredStudents.map((student) => {
            const age = calculateAge(student.birthDate)
            return (
              <Card
                key={student.id}
                className="hover:shadow-lg transition-shadow border-2 cursor-pointer hover:border-primary/50"
                onClick={() => handleStudentClick(student)}
              >
                <CardContent className="p-6">
                  <div className="flex flex-col items-center text-center space-y-4">
                    <div className="relative h-32 w-32 rounded-full overflow-hidden bg-primary/10 border-4 border-primary/20">
                      <Image
                        src={student.photo || "/placeholder.svg?height=128&width=128&query=student+soccer"}
                        alt={student.name}
                        fill
                        className="object-cover"
                      />
                    </div>
                    <div className="space-y-2 w-full">
                      <h3 className="font-bold text-foreground text-lg leading-tight">{student.name}</h3>
                      <div className="space-y-1 pt-2 border-t">
                        <p className="text-sm text-muted-foreground">
                          <span className="font-semibold">{age} anos</span>
                        </p>
                        {student.scheduleConfigs && student.scheduleConfigs.length > 0 ? (
                          <div className="flex flex-wrap gap-1 justify-center">
                            {student.scheduleConfigs.map((config, idx) => (
                              <span key={idx} className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary">
                                {config.day.slice(0, 3)} {config.schedule.split("-")[0]}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <>
                            {student.classDays && student.classDays.length > 0 && (
                              <div className="flex flex-wrap gap-1 justify-center mb-2">
                                {student.classDays.map((day) => (
                                  <span
                                    key={day}
                                    className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary"
                                  >
                                    {day}
                                  </span>
                                ))}
                              </div>
                            )}
                            <div className="flex items-center justify-center gap-2 text-sm">
                              <Clock className="h-3.5 w-3.5 text-primary" />
                              <span className="font-medium text-foreground">{student.classSchedule}</span>
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}

          {filteredStudents.length === 0 && (
            <div className="col-span-full">
              <Card className="border-2">
                <CardContent className="p-12 text-center">
                  <h3 className="text-lg font-semibold text-foreground mb-2">Nenhum aluno encontrado</h3>
                  <p className="text-muted-foreground mb-4">Não há alunos cadastrados com os filtros selecionados</p>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setScheduleFilter("all")
                      setDayFilter("all")
                      setNameFilter("")
                    }}
                  >
                    Limpar Filtros
                  </Button>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </main>

      <StudentDetailModal student={selectedStudent} isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </div>
  )
}
