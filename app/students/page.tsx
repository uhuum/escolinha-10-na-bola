"use client"

import { useState } from "react"
import { useStudents } from "@/lib/hooks/use-students"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { formatCurrency } from "@/lib/utils/currency"
import { Search, Filter, Users, Upload, Trash2, Eye } from "lucide-react"
import Link from "next/link"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import type { PaymentStatus } from "@/lib/types"
import { toast } from "@/components/ui/use-toast"
import { AppHeader } from "@/components/app-header"
import Image from "next/image"

export default function StudentsPage() {
  const { students, deleteStudent } = useStudents()
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState<PaymentStatus | "all">("all")
  const [activeFilter, setActiveFilter] = useState<"all" | "active" | "inactive">("all")
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [studentToDelete, setStudentToDelete] = useState<string | null>(null)

  const currentMonth = "Outubro"

  const filteredStudents = students.filter((student) => {
    const matchesSearch =
      searchQuery === "" ||
      student.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      student.responsible.toLowerCase().includes(searchQuery.toLowerCase())

    const currentPayment = student.payments.find((p) => p.month === currentMonth)
    const matchesStatus = statusFilter === "all" || currentPayment?.status === statusFilter

    const matchesActive =
      activeFilter === "all" ||
      (activeFilter === "active" && student.isActive) ||
      (activeFilter === "inactive" && !student.isActive)

    return matchesSearch && matchesStatus && matchesActive
  })

  const handleDelete = (studentId: string) => {
    setStudentToDelete(studentId)
    setShowDeleteDialog(true)
  }

  const confirmDelete = () => {
    if (studentToDelete) {
      deleteStudent(studentToDelete)
      toast({
        title: "Aluno excluído",
        description: "O aluno foi removido permanentemente do sistema",
      })
      setShowDeleteDialog(false)
      setStudentToDelete(null)
    }
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <AppHeader />

      <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 lg:py-12 flex-1">
        <div className="mb-8 lg:mb-10">
          <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-2 sm:mb-3 text-balance">Lista de Alunos</h2>
          <p className="text-base sm:text-lg text-muted-foreground">
            Gerenciamento completo de {students.length} alunos cadastrados
          </p>
        </div>

        <Card className="mb-6 sm:mb-8 border-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
              <div className="flex h-8 w-8 sm:h-10 sm:w-10 items-center justify-center rounded-lg bg-primary/10">
                <Filter className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
              </div>
              Filtros e Busca
            </CardTitle>
            <CardDescription className="text-sm sm:text-base">
              Encontre alunos por nome, responsável ou status de pagamento
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 md:grid-cols-3">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por nome ou responsável..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
              <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as PaymentStatus | "all")}>
                <SelectTrigger>
                  <SelectValue placeholder="Status de Pagamento" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os Status</SelectItem>
                  <SelectItem value="Pago">Pago</SelectItem>
                  <SelectItem value="Não Pagou">Não Pagou</SelectItem>
                  <SelectItem value="Em Aberto">Em Aberto</SelectItem>
                  <SelectItem value="Bolsista">Bolsista</SelectItem>
                  <SelectItem value="AFASTADO">Afastado</SelectItem>
                  <SelectItem value="Cobrado">Cobrado</SelectItem>
                </SelectContent>
              </Select>
              <Select
                value={activeFilter}
                onValueChange={(value) => setActiveFilter(value as "all" | "active" | "inactive")}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Status do Aluno" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="active">Ativos</SelectItem>
                  <SelectItem value="inactive">Inativos</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        <div className="mb-4 sm:mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
          <p className="text-sm sm:text-base text-muted-foreground">
            Mostrando <span className="font-semibold text-foreground">{filteredStudents.length}</span> de{" "}
            <span className="font-semibold text-foreground">{students.length}</span> alunos
          </p>
          <div className="flex gap-2 sm:gap-3 w-full sm:w-auto">
            <Button
              asChild
              variant="outline"
              className="gap-2 bg-transparent flex-1 sm:flex-initial text-sm sm:text-base"
            >
              <Link href="/students/import">
                <Upload className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                Importar
              </Link>
            </Button>
            <Button asChild className="gap-2 flex-1 sm:flex-initial text-sm sm:text-base">
              <Link href="/students/new">
                <Users className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                Novo Aluno
              </Link>
            </Button>
          </div>
        </div>

        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
          {filteredStudents.map((student) => {
            const currentPayment = student.payments.find((p) => p.month === currentMonth)
            return (
              <Card key={student.id} className="border-2 hover:border-primary/30 transition-all hover:shadow-lg">
                <CardContent className="p-4 sm:p-6">
                  <div className="flex items-start gap-3 sm:gap-4 mb-3 sm:mb-4">
                    <div className="relative h-12 w-12 sm:h-16 sm:w-16 rounded-full overflow-hidden bg-primary/10 border-2 border-primary/20 flex-shrink-0">
                      <Image
                        src={student.photo || "/placeholder.svg?height=64&width=64&query=student"}
                        alt={student.name}
                        fill
                        className="object-cover"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-foreground text-base sm:text-lg mb-1 truncate">{student.name}</h3>
                      <p className="text-xs sm:text-sm text-muted-foreground truncate">{student.responsible}</p>
                    </div>
                  </div>

                  <div className="space-y-1.5 sm:space-y-2 mb-3 sm:mb-4 pb-3 sm:pb-4 border-b">
                    <div className="flex justify-between text-xs sm:text-sm">
                      <span className="text-muted-foreground">Mensalidade:</span>
                      <span className="font-semibold text-foreground">{formatCurrency(student.monthlyValue)}</span>
                    </div>
                    {student.fatherPhone && (
                      <div className="flex justify-between text-xs sm:text-sm">
                        <span className="text-muted-foreground">Tel. Pai:</span>
                        <span className="font-medium text-foreground">{student.fatherPhone}</span>
                      </div>
                    )}
                    {student.motherPhone && (
                      <div className="flex justify-between text-xs sm:text-sm">
                        <span className="text-muted-foreground">Tel. Mãe:</span>
                        <span className="font-medium text-foreground">{student.motherPhone}</span>
                      </div>
                    )}
                  </div>

                  <div className="flex gap-2">
                    <Button asChild size="sm" className="flex-1 gap-1 text-xs sm:text-sm h-8 sm:h-9">
                      <Link href={`/students/${student.id}`}>
                        <Eye className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                        Ver Detalhes
                      </Link>
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => handleDelete(student.id)}
                      className="h-8 sm:h-9 px-2 sm:px-3"
                    >
                      <Trash2 className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>

        {filteredStudents.length === 0 && (
          <Card className="border-2">
            <CardContent className="p-8 sm:p-12 text-center">
              <Users className="h-10 w-10 sm:h-12 sm:w-12 text-muted-foreground mx-auto mb-3 sm:mb-4" />
              <h3 className="text-base sm:text-lg font-semibold text-foreground mb-2">Nenhum aluno encontrado</h3>
              <p className="text-sm sm:text-base text-muted-foreground">
                Tente ajustar os filtros ou adicione um novo aluno
              </p>
            </CardContent>
          </Card>
        )}
      </main>

      {showDeleteDialog && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-md border-2">
            <CardHeader>
              <CardTitle className="text-lg sm:text-xl">Confirmar Exclusão</CardTitle>
              <CardDescription className="text-sm sm:text-base">
                Tem certeza que deseja excluir este aluno? Esta ação não pode ser desfeita.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex gap-3 justify-end">
              <Button variant="outline" onClick={() => setShowDeleteDialog(false)} className="text-sm sm:text-base">
                Cancelar
              </Button>
              <Button variant="destructive" onClick={confirmDelete} className="text-sm sm:text-base">
                Excluir Permanentemente
              </Button>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
