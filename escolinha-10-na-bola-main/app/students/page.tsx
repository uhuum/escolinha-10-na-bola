"use client"

import { useState } from "react"
import { useStudents } from "@/lib/hooks/use-students"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { formatCurrency } from "@/lib/utils/currency"
import { Search, Filter, Users, Upload, Trash2, Eye, Archive, UserX, RotateCcw } from "lucide-react"
import Link from "next/link"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import type { PaymentStatus } from "@/lib/types"
import { toast } from "@/components/ui/use-toast"
import { AppHeader } from "@/components/app-header"
import Image from "next/image"
import { LoadingStudents } from "@/components/loading-students"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"

export default function StudentsPage() {
  const { students, deleteStudent, archiveStudent, restoreStudent, isLoading } = useStudents()
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState<PaymentStatus | "all">("all")
  const [activeTab, setActiveTab] = useState<"active" | "archived">("active")
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [showArchiveDialog, setShowArchiveDialog] = useState(false)
  const [studentToDelete, setStudentToDelete] = useState<string | null>(null)
  const [studentToArchive, setStudentToArchive] = useState<string | null>(null)
  const [archiveReason, setArchiveReason] = useState("")
  const [expandedPhoto, setExpandedPhoto] = useState<{ url: string; name: string } | null>(null)

  const currentMonth = "Janeiro"

  const activeStudents = students.filter((s) => s.isActive && !s.archivedAt)
  const archivedStudents = students.filter((s) => !s.isActive || s.archivedAt)

  const filteredStudents = (activeTab === "active" ? activeStudents : archivedStudents).filter((student) => {
    const matchesSearch =
      searchQuery === "" ||
      student.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      student.responsible.toLowerCase().includes(searchQuery.toLowerCase())

    const currentPayment = student.payments.find((p) => p.month === currentMonth)
    const matchesStatus = statusFilter === "all" || currentPayment?.status === statusFilter

    return matchesSearch && matchesStatus
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

  const handleArchive = (studentId: string) => {
    setStudentToArchive(studentId)
    setArchiveReason("")
    setShowArchiveDialog(true)
  }

  const confirmArchive = () => {
    if (studentToArchive) {
      archiveStudent(studentToArchive, archiveReason)
      toast({
        title: "Aluno arquivado",
        description: "O aluno foi movido para a seção de alunos que saíram",
      })
      setShowArchiveDialog(false)
      setStudentToArchive(null)
      setArchiveReason("")
    }
  }

  const handleRestore = (studentId: string) => {
    restoreStudent(studentId)
    toast({
      title: "Aluno restaurado",
      description: "O aluno foi reativado com sucesso",
    })
  }

  if (isLoading) {
    return <LoadingStudents message="Carregando lista de alunos..." />
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <AppHeader />

      <main className="container mx-auto px-3 sm:px-4 lg:px-8 py-4 sm:py-6 lg:py-12 flex-1">
        <div className="mb-4 sm:mb-6 lg:mb-10">
          <h2 className="text-xl sm:text-2xl lg:text-4xl font-bold text-foreground mb-1 sm:mb-2 text-balance">
            Lista de Alunos
          </h2>
          <p className="text-xs sm:text-sm lg:text-lg text-muted-foreground">
            Gerenciamento completo de {activeStudents.length} alunos ativos
            {archivedStudents.length > 0 && ` e ${archivedStudents.length} arquivados`}
          </p>
        </div>

        <Tabs
          value={activeTab}
          onValueChange={(v) => setActiveTab(v as "active" | "archived")}
          className="mb-4 sm:mb-6"
        >
          <TabsList className="grid w-full max-w-md grid-cols-2 h-9 sm:h-10">
            <TabsTrigger value="active" className="gap-1 sm:gap-2 text-xs sm:text-sm">
              <Users className="h-3 w-3 sm:h-4 sm:w-4" />
              Ativos ({activeStudents.length})
            </TabsTrigger>
            <TabsTrigger value="archived" className="gap-1 sm:gap-2 text-xs sm:text-sm">
              <UserX className="h-3 w-3 sm:h-4 sm:w-4" />
              Arquivados ({archivedStudents.length})
            </TabsTrigger>
          </TabsList>
        </Tabs>

        <Card className="mb-4 sm:mb-6 border-2">
          <CardHeader className="p-3 sm:p-4 lg:p-6">
            <CardTitle className="flex items-center gap-2 text-sm sm:text-base lg:text-xl">
              <div className="flex h-7 w-7 sm:h-8 sm:w-8 lg:h-10 lg:w-10 items-center justify-center rounded-lg bg-primary/10">
                <Filter className="h-3.5 w-3.5 sm:h-4 sm:w-4 lg:h-5 lg:w-5 text-primary" />
              </div>
              Filtros e Busca
            </CardTitle>
            <CardDescription className="text-xs sm:text-sm lg:text-base">
              Encontre alunos por nome, responsável ou status de pagamento
            </CardDescription>
          </CardHeader>
          <CardContent className="p-3 sm:p-4 lg:p-6 pt-0">
            <div className="grid gap-2 sm:gap-3 lg:gap-4 grid-cols-1 sm:grid-cols-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por nome ou responsável..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 h-9 sm:h-10 text-sm"
                />
              </div>
              <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as PaymentStatus | "all")}>
                <SelectTrigger className="h-9 sm:h-10 text-sm">
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
            </div>
          </CardContent>
        </Card>

        <div className="mb-3 sm:mb-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-4">
          <p className="text-xs sm:text-sm lg:text-base text-muted-foreground">
            Mostrando <span className="font-semibold text-foreground">{filteredStudents.length}</span> de{" "}
            <span className="font-semibold text-foreground">
              {activeTab === "active" ? activeStudents.length : archivedStudents.length}
            </span>{" "}
            alunos {activeTab === "active" ? "ativos" : "arquivados"}
          </p>
          {activeTab === "active" && (
            <div className="flex gap-2 w-full sm:w-auto">
              <Button
                asChild
                variant="outline"
                className="gap-1 sm:gap-2 bg-transparent flex-1 sm:flex-initial text-xs sm:text-sm h-8 sm:h-9"
              >
                <Link href="/students/import">
                  <Upload className="h-3 w-3 sm:h-4 sm:w-4" />
                  Importar
                </Link>
              </Button>
              <Button asChild className="gap-1 sm:gap-2 flex-1 sm:flex-initial text-xs sm:text-sm h-8 sm:h-9">
                <Link href="/students/new">
                  <Users className="h-3 w-3 sm:h-4 sm:w-4" />
                  Novo Aluno
                </Link>
              </Button>
            </div>
          )}
        </div>

        <div className="grid gap-2 sm:gap-3 grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6">
          {filteredStudents.map((student) => {
            const currentPayment = student.payments.find((p) => p.month === currentMonth)
            const isArchived = !student.isActive || student.archivedAt

            return (
              <Card
                key={student.id}
                className={`border-2 transition-all hover:shadow-lg ${
                  isArchived ? "border-muted bg-muted/30" : "hover:border-primary/30"
                }`}
              >
                <CardContent className="p-2 sm:p-3">
                  <div className="flex flex-col items-center text-center mb-2 sm:mb-3">
                    <button
                      type="button"
                      onClick={() =>
                        setExpandedPhoto({ url: student.photo || "/diverse-students-studying.png", name: student.name })
                      }
                      className={`relative h-12 w-12 sm:h-14 sm:w-14 lg:h-16 lg:w-16 rounded-full overflow-hidden border-2 flex-shrink-0 mb-1.5 sm:mb-2 cursor-pointer hover:scale-105 transition-transform ${
                        isArchived ? "bg-muted border-muted-foreground/20 grayscale" : "bg-primary/10 border-primary/20"
                      }`}
                      title="Clique para expandir foto"
                    >
                      <Image
                        src={student.photo || "/placeholder.svg?height=200&width=200&query=student"}
                        alt={student.name}
                        fill
                        className="object-cover"
                      />
                    </button>
                    <h3
                      className={`font-bold text-xs sm:text-sm mb-0.5 line-clamp-2 ${
                        isArchived ? "text-muted-foreground" : "text-foreground"
                      }`}
                      title={student.name}
                    >
                      {student.name}
                    </h3>
                    <p
                      className="text-[10px] sm:text-xs text-muted-foreground line-clamp-1"
                      title={student.responsible}
                    >
                      {student.responsible}
                    </p>
                    {isArchived && student.archiveReason && (
                      <p
                        className="text-[10px] sm:text-xs text-orange-600 mt-0.5 sm:mt-1 line-clamp-1"
                        title={student.archiveReason}
                      >
                        {student.archiveReason}
                      </p>
                    )}
                  </div>

                  <div className="space-y-0.5 sm:space-y-1 mb-2 sm:mb-3 pb-2 sm:pb-3 border-b text-[10px] sm:text-xs">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Mensalidade:</span>
                      <span className="font-semibold text-foreground">{formatCurrency(student.monthlyValue)}</span>
                    </div>
                  </div>

                  <div className="flex gap-1 sm:gap-1.5">
                    <Button
                      asChild
                      size="sm"
                      className="flex-1 gap-0.5 sm:gap-1 text-[10px] sm:text-xs h-6 sm:h-7 px-1 sm:px-2"
                    >
                      <Link href={`/students/${student.id}`}>
                        <Eye className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
                        Detalhes
                      </Link>
                    </Button>
                    {isArchived ? (
                      <>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleRestore(student.id)}
                          className="h-6 sm:h-7 px-1.5 sm:px-2"
                          title="Restaurar aluno"
                        >
                          <RotateCcw className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handleDelete(student.id)}
                          className="h-6 sm:h-7 px-1.5 sm:px-2"
                          title="Excluir permanentemente"
                        >
                          <Trash2 className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
                        </Button>
                      </>
                    ) : (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleArchive(student.id)}
                        className="h-6 sm:h-7 px-1.5 sm:px-2 text-orange-600 hover:text-orange-700 hover:bg-orange-50"
                        title="Arquivar aluno"
                      >
                        <Archive className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>

        {filteredStudents.length === 0 && (
          <Card className="border-2">
            <CardContent className="p-6 sm:p-8 lg:p-12 text-center">
              {activeTab === "active" ? (
                <>
                  <Users className="h-8 w-8 sm:h-10 sm:w-10 lg:h-12 lg:w-12 text-muted-foreground mx-auto mb-2 sm:mb-3" />
                  <h3 className="text-sm sm:text-base lg:text-lg font-semibold text-foreground mb-1 sm:mb-2">
                    Nenhum aluno encontrado
                  </h3>
                  <p className="text-xs sm:text-sm lg:text-base text-muted-foreground">
                    Tente ajustar os filtros ou adicione um novo aluno
                  </p>
                </>
              ) : (
                <>
                  <UserX className="h-8 w-8 sm:h-10 sm:w-10 lg:h-12 lg:w-12 text-muted-foreground mx-auto mb-2 sm:mb-3" />
                  <h3 className="text-sm sm:text-base lg:text-lg font-semibold text-foreground mb-1 sm:mb-2">
                    Nenhum aluno arquivado
                  </h3>
                  <p className="text-xs sm:text-sm lg:text-base text-muted-foreground">
                    Alunos que saírem da escolinha aparecerão aqui
                  </p>
                </>
              )}
            </CardContent>
          </Card>
        )}
      </main>

      {/* Photo Modal */}
      {expandedPhoto && (
        <div
          className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          onClick={() => setExpandedPhoto(null)}
        >
          <div className="relative max-w-2xl w-full" onClick={(e) => e.stopPropagation()}>
            <button
              onClick={() => setExpandedPhoto(null)}
              className="absolute -top-10 sm:-top-12 right-0 text-white hover:text-gray-300 text-base sm:text-lg font-bold"
            >
              Fechar ✕
            </button>
            <div className="relative w-full aspect-square bg-background rounded-lg overflow-hidden">
              <Image
                src={expandedPhoto.url || "/placeholder.svg"}
                alt={expandedPhoto.name}
                fill
                className="object-contain"
              />
            </div>
            <p className="text-white text-center mt-3 sm:mt-4 text-lg sm:text-xl font-semibold">{expandedPhoto.name}</p>
          </div>
        </div>
      )}

      {/* Archive Dialog */}
      {showArchiveDialog && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-md border-2">
            <CardHeader className="p-4 sm:p-6">
              <CardTitle className="text-base sm:text-lg lg:text-xl flex items-center gap-2">
                <Archive className="h-4 w-4 sm:h-5 sm:w-5 text-orange-600" />
                Arquivar Aluno
              </CardTitle>
              <CardDescription className="text-xs sm:text-sm lg:text-base">
                O aluno será movido para a seção "Alunos que saíram". Você pode restaurá-lo depois se necessário.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 p-4 sm:p-6 pt-0">
              <div className="space-y-2">
                <Label htmlFor="archiveReason" className="text-sm">
                  Motivo (opcional)
                </Label>
                <Textarea
                  id="archiveReason"
                  placeholder="Ex: Mudou de cidade, Desistiu, etc."
                  value={archiveReason}
                  onChange={(e) => setArchiveReason(e.target.value)}
                  rows={3}
                  className="text-sm"
                />
              </div>
              <div className="flex gap-2 sm:gap-3 justify-end">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowArchiveDialog(false)
                    setStudentToArchive(null)
                    setArchiveReason("")
                  }}
                  className="text-xs sm:text-sm"
                >
                  Cancelar
                </Button>
                <Button onClick={confirmArchive} className="text-xs sm:text-sm bg-orange-600 hover:bg-orange-700">
                  Arquivar
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Delete Dialog */}
      {showDeleteDialog && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-md border-2">
            <CardHeader className="p-4 sm:p-6">
              <CardTitle className="text-base sm:text-lg lg:text-xl text-destructive">
                Excluir Permanentemente
              </CardTitle>
              <CardDescription className="text-xs sm:text-sm lg:text-base">
                Tem certeza que deseja excluir este aluno? Esta ação não pode ser desfeita e todos os dados serão
                perdidos.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex gap-2 sm:gap-3 justify-end p-4 sm:p-6 pt-0">
              <Button variant="outline" onClick={() => setShowDeleteDialog(false)} className="text-xs sm:text-sm">
                Cancelar
              </Button>
              <Button variant="destructive" onClick={confirmDelete} className="text-xs sm:text-sm">
                Excluir Permanentemente
              </Button>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
