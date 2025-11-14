"use client"

import type React from "react"

import { useState } from "react"
import { useStudents } from "@/lib/hooks/use-students"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Upload, FileSpreadsheet, FileText, CheckCircle, AlertCircle } from "lucide-react"
import Link from "next/link"
import { useToast } from "@/hooks/use-toast"
import { useRouter } from "next/navigation"

export default function ImportStudentsPage() {
  const { importStudents } = useStudents()
  const { toast } = useToast()
  const router = useRouter()
  const [file, setFile] = useState<File | null>(null)
  const [importing, setImporting] = useState(false)
  const [preview, setPreview] = useState<any[]>([])

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (!selectedFile) return

    setFile(selectedFile)

    // Simular preview dos dados
    const mockPreview = [
      {
        name: "João Silva",
        rg: "12.345.678-9",
        birthDate: "15/03/2010",
        responsible: "Maria Silva",
        responsibleCpf: "123.456.789-00",
        responsibleEmail: "maria@email.com",
        fatherPhone: "(11) 98765-4321",
        motherPhone: "(11) 98765-4322",
        monthlyValue: 100,
      },
    ]
    setPreview(mockPreview)
  }

  const handleImport = async () => {
    if (!file) return

    setImporting(true)

    try {
      // Simular importação
      await new Promise((resolve) => setTimeout(resolve, 2000))

      const studentsToImport = preview.map((data) => ({
        ...data,
        isActive: true,
        classSchedule: "18:00-19:30" as const,
        classDays: ["Segunda", "Quarta", "Sexta"] as const,
        payments: [],
      }))

      importStudents(studentsToImport)

      toast({
        title: "Importação concluída",
        description: `${studentsToImport.length} aluno(s) importado(s) com sucesso`,
      })

      router.push("/students")
    } catch (error) {
      toast({
        title: "Erro na importação",
        description: "Não foi possível importar os alunos. Verifique o arquivo.",
        variant: "destructive",
      })
    } finally {
      setImporting(false)
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-foreground">SIGA</h1>
              <p className="text-sm text-muted-foreground">Sistema Integrado de Gestão de Alunos</p>
            </div>
            <nav className="flex gap-2">
              <Button asChild variant="ghost">
                <Link href="/">Dashboard</Link>
              </Button>
              <Button asChild variant="default">
                <Link href="/students">Alunos</Link>
              </Button>
              <Button asChild variant="ghost">
                <Link href="/payments">Pagamentos</Link>
              </Button>
            </nav>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <Button asChild variant="ghost" className="mb-4">
            <Link href="/students">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Voltar para Lista de Alunos
            </Link>
          </Button>
          <h2 className="text-3xl font-bold text-foreground mb-2">Importar Alunos</h2>
          <p className="text-muted-foreground">Importe múltiplos alunos através de arquivo Excel ou PDF</p>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Upload className="h-5 w-5" />
                Upload de Arquivo
              </CardTitle>
              <CardDescription>Selecione um arquivo Excel (.xlsx, .xls) ou PDF com os dados dos alunos</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="border-2 border-dashed rounded-lg p-8 text-center hover:border-primary transition-colors">
                <input
                  type="file"
                  accept=".xlsx,.xls,.pdf"
                  onChange={handleFileChange}
                  className="hidden"
                  id="file-upload"
                />
                <label htmlFor="file-upload" className="cursor-pointer">
                  <div className="flex flex-col items-center gap-3">
                    {file ? (
                      <>
                        <CheckCircle className="h-12 w-12 text-green-500" />
                        <p className="font-medium text-foreground">{file.name}</p>
                        <p className="text-sm text-muted-foreground">Clique para selecionar outro arquivo</p>
                      </>
                    ) : (
                      <>
                        <Upload className="h-12 w-12 text-muted-foreground" />
                        <p className="font-medium text-foreground">Clique para selecionar arquivo</p>
                        <p className="text-sm text-muted-foreground">ou arraste e solte aqui</p>
                      </>
                    )}
                  </div>
                </label>
              </div>

              <div className="space-y-2">
                <h4 className="font-semibold text-sm">Formatos aceitos:</h4>
                <div className="flex gap-2">
                  <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-muted">
                    <FileSpreadsheet className="h-4 w-4 text-green-600" />
                    <span className="text-sm">Excel (.xlsx, .xls)</span>
                  </div>
                  <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-muted">
                    <FileText className="h-4 w-4 text-red-600" />
                    <span className="text-sm">PDF (.pdf)</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Instruções</CardTitle>
              <CardDescription>Formato esperado para importação</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <h4 className="font-semibold text-sm mb-2">Colunas necessárias no Excel:</h4>
                  <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
                    <li>Nome do Aluno</li>
                    <li>RG do Aluno</li>
                    <li>Data de Nascimento</li>
                    <li>Nome do Responsável</li>
                    <li>CPF do Responsável</li>
                    <li>Email do Responsável</li>
                    <li>Telefone do Pai</li>
                    <li>Telefone da Mãe</li>
                    <li>Valor da Mensalidade</li>
                  </ul>
                </div>

                <div className="p-4 rounded-lg bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800">
                  <div className="flex gap-2">
                    <AlertCircle className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                    <div className="text-sm text-blue-900 dark:text-blue-100">
                      <p className="font-semibold mb-1">Dica:</p>
                      <p>
                        Após o upload, você poderá revisar e confirmar os dados antes de importar definitivamente para o
                        sistema.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {preview.length > 0 && (
          <Card className="mt-6">
            <CardHeader>
              <CardTitle>Preview dos Dados</CardTitle>
              <CardDescription>Revise os dados antes de importar</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-muted/50 border-b">
                    <tr>
                      <th className="text-left p-3">Nome</th>
                      <th className="text-left p-3">RG</th>
                      <th className="text-left p-3">Responsável</th>
                      <th className="text-left p-3">Email</th>
                      <th className="text-left p-3">Mensalidade</th>
                    </tr>
                  </thead>
                  <tbody>
                    {preview.map((student, index) => (
                      <tr key={index} className="border-b">
                        <td className="p-3">{student.name}</td>
                        <td className="p-3">{student.rg}</td>
                        <td className="p-3">{student.responsible}</td>
                        <td className="p-3">{student.responsibleEmail}</td>
                        <td className="p-3">R$ {student.monthlyValue.toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="flex gap-3 justify-end mt-6">
                <Button variant="outline" onClick={() => setPreview([])}>
                  Cancelar
                </Button>
                <Button onClick={handleImport} disabled={importing}>
                  {importing ? "Importando..." : `Importar ${preview.length} Aluno(s)`}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  )
}
