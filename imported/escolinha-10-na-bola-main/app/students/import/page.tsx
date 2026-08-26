"use client"

import type React from "react"

import { useState, useCallback } from "react"
import { useStudents } from "@/lib/hooks/use-students"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Upload, FileSpreadsheet, CheckCircle, AlertCircle, Download, Users, X } from "lucide-react"
import Link from "next/link"
import { useToast } from "@/hooks/use-toast"
import { useRouter } from "next/navigation"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { AppHeader } from "@/components/app-header"

interface CSVStudent {
  nome: string
  rg: string
  dataNascimento: string
  responsavel: string
  cpfResponsavel: string
  emailResponsavel: string
  telefonePai: string
  telefoneMae: string
  mensalidade: string
  bolsista: string
}

interface ParsedStudent {
  name: string
  rg: string
  birthDate: string
  responsible: string
  responsibleCpf: string
  responsibleEmail: string
  fatherPhone: string
  motherPhone: string
  monthlyValue: number
  isScholarship: boolean
  isValid: boolean
  errors: string[]
}

function parseCSV(text: string): CSVStudent[] {
  const lines = text.split("\n").filter((line) => line.trim())
  if (lines.length < 2) return []

  const headers = lines[0].split(",").map((h) => h.trim().toLowerCase())
  const students: CSVStudent[] = []

  for (let i = 1; i < lines.length; i++) {
    const values = parseCSVLine(lines[i])
    if (values.length >= 10) {
      students.push({
        nome: values[0]?.trim() || "",
        rg: values[1]?.trim() || "",
        dataNascimento: values[2]?.trim() || "",
        responsavel: values[3]?.trim() || "",
        cpfResponsavel: values[4]?.trim() || "",
        emailResponsavel: values[5]?.trim() || "",
        telefonePai: values[6]?.trim() || "",
        telefoneMae: values[7]?.trim() || "",
        mensalidade: values[8]?.trim() || "0",
        bolsista: values[9]?.trim().toLowerCase() || "não",
      })
    }
  }

  return students
}

function parseCSVLine(line: string): string[] {
  const result: string[] = []
  let current = ""
  let inQuotes = false

  for (let i = 0; i < line.length; i++) {
    const char = line[i]

    if (char === '"') {
      inQuotes = !inQuotes
    } else if (char === "," && !inQuotes) {
      result.push(current)
      current = ""
    } else {
      current += char
    }
  }
  result.push(current)

  return result
}

function validateStudent(csv: CSVStudent): ParsedStudent {
  const errors: string[] = []

  // Nome é obrigatório
  if (!csv.nome || csv.nome.length < 2) {
    errors.push("Nome inválido")
  }

  // Responsável é obrigatório
  if (!csv.responsavel || csv.responsavel.length < 2) {
    errors.push("Responsável inválido")
  }

  // Mensalidade deve ser um número válido
  const mensalidade = Number.parseFloat(csv.mensalidade.replace(",", ".")) || 0
  if (isNaN(mensalidade) || mensalidade < 0) {
    errors.push("Mensalidade inválida")
  }

  // Formatar data de nascimento (DD/MM/YYYY)
  let birthDate = csv.dataNascimento
  if (birthDate && birthDate.includes("/")) {
    // Mantém o formato DD/MM/YYYY
    birthDate = csv.dataNascimento
  }

  // Bolsista
  const isScholarship =
    csv.bolsista === "sim" || csv.bolsista === "s" || csv.bolsista === "true" || csv.bolsista === "1"

  return {
    name: csv.nome,
    rg: csv.rg || "",
    birthDate: birthDate || "",
    responsible: csv.responsavel,
    responsibleCpf: csv.cpfResponsavel || "",
    responsibleEmail: csv.emailResponsavel || "",
    fatherPhone: csv.telefonePai || "",
    motherPhone: csv.telefoneMae || "",
    monthlyValue: isScholarship ? 0 : mensalidade,
    isScholarship,
    isValid: errors.length === 0,
    errors,
  }
}

export default function ImportStudentsPage() {
  const { addStudent, students } = useStudents()
  const { toast } = useToast()
  const router = useRouter()
  const [file, setFile] = useState<File | null>(null)
  const [importing, setImporting] = useState(false)
  const [parsedStudents, setParsedStudents] = useState<ParsedStudent[]>([])
  const [importProgress, setImportProgress] = useState(0)
  const [importedCount, setImportedCount] = useState(0)
  const [errorCount, setErrorCount] = useState(0)
  const [isDragging, setIsDragging] = useState(false)

  const processFile = useCallback(
    async (selectedFile: File) => {
      setFile(selectedFile)
      setParsedStudents([])
      setImportProgress(0)
      setImportedCount(0)
      setErrorCount(0)

      try {
        const text = await selectedFile.text()
        const csvStudents = parseCSV(text)

        if (csvStudents.length === 0) {
          toast({
            title: "Arquivo vazio",
            description: "O arquivo CSV não contém dados válidos",
            variant: "destructive",
          })
          return
        }

        const parsed = csvStudents.map(validateStudent)
        setParsedStudents(parsed)

        const validCount = parsed.filter((s) => s.isValid).length
        const invalidCount = parsed.filter((s) => !s.isValid).length

        toast({
          title: "Arquivo processado",
          description: `${validCount} aluno(s) válido(s), ${invalidCount} com erro(s)`,
        })
      } catch (error) {
        console.error("[v0] Error parsing CSV:", error)
        toast({
          title: "Erro ao processar arquivo",
          description: "Verifique se o arquivo está no formato CSV correto",
          variant: "destructive",
        })
      }
    },
    [toast],
  )

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (!selectedFile) return

    if (!selectedFile.name.endsWith(".csv")) {
      toast({
        title: "Formato inválido",
        description: "Por favor, selecione um arquivo CSV (.csv)",
        variant: "destructive",
      })
      return
    }

    await processFile(selectedFile)
  }

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }, [])

  const handleDrop = useCallback(
    async (e: React.DragEvent) => {
      e.preventDefault()
      setIsDragging(false)

      const droppedFile = e.dataTransfer.files[0]
      if (!droppedFile) return

      if (!droppedFile.name.endsWith(".csv")) {
        toast({
          title: "Formato inválido",
          description: "Por favor, selecione um arquivo CSV (.csv)",
          variant: "destructive",
        })
        return
      }

      await processFile(droppedFile)
    },
    [processFile, toast],
  )

  const handleImport = async () => {
    const validStudents = parsedStudents.filter((s) => s.isValid)

    if (validStudents.length === 0) {
      toast({
        title: "Nenhum aluno válido",
        description: "Corrija os erros antes de importar",
        variant: "destructive",
      })
      return
    }

    setImporting(true)
    setImportProgress(0)
    setImportedCount(0)
    setErrorCount(0)

    let successCount = 0
    let failCount = 0

    for (let i = 0; i < validStudents.length; i++) {
      const student = validStudents[i]

      try {
        // Verificar se aluno já existe (por nome)
        const existingStudent = students.find((s) => s.name.toLowerCase().trim() === student.name.toLowerCase().trim())

        if (existingStudent) {
          failCount++
          continue
        }

        await addStudent({
          name: student.name,
          rg: student.rg,
          birthDate: student.birthDate,
          responsible: student.responsible,
          responsibleCpf: student.responsibleCpf,
          responsibleEmail: student.responsibleEmail,
          fatherPhone: student.fatherPhone,
          motherPhone: student.motherPhone,
          monthlyValue: student.monthlyValue,
          isActive: true,
          isScholarship: student.isScholarship,
          classSchedule: "18:00-19:30",
          classDays: ["Segunda", "Quarta", "Sexta"],
          payments: [],
        })

        successCount++
      } catch (error) {
        console.error("[v0] Error importing student:", student.name, error)
        failCount++
      }

      setImportProgress(((i + 1) / validStudents.length) * 100)
      setImportedCount(successCount)
      setErrorCount(failCount)

      // Pequeno delay para não sobrecarregar
      await new Promise((resolve) => setTimeout(resolve, 50))
    }

    setImporting(false)

    if (successCount > 0) {
      toast({
        title: "Importação concluída",
        description: `${successCount} aluno(s) importado(s) com sucesso. ${failCount > 0 ? `${failCount} ignorado(s) (duplicados ou erros).` : ""}`,
      })

      // Aguardar um pouco e redirecionar
      setTimeout(() => {
        router.push("/students")
      }, 2000)
    } else {
      toast({
        title: "Nenhum aluno importado",
        description: "Todos os alunos já existem ou ocorreram erros",
        variant: "destructive",
      })
    }
  }

  const clearFile = () => {
    setFile(null)
    setParsedStudents([])
    setImportProgress(0)
    setImportedCount(0)
    setErrorCount(0)
  }

  const validCount = parsedStudents.filter((s) => s.isValid).length
  const invalidCount = parsedStudents.filter((s) => !s.isValid).length

  const downloadTemplate = () => {
    const headers =
      "nome,rg,dataNascimento,responsavel,cpfResponsavel,emailResponsavel,telefonePai,telefoneMae,mensalidade,bolsista"
    const example =
      "João Silva,12.345.678-9,15/03/2010,Maria Silva,123.456.789-00,maria@email.com,(11) 98765-4321,(11) 98765-4322,100,não"
    const csvContent = `${headers}\n${example}`

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
    const link = document.createElement("a")
    link.href = URL.createObjectURL(blob)
    link.download = "modelo_importacao_alunos.csv"
    link.click()
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <AppHeader />

      <main className="container mx-auto px-4 py-8 flex-1">
        <div className="mb-8">
          <Button asChild variant="ghost" className="mb-4">
            <Link href="/students">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Voltar para Lista de Alunos
            </Link>
          </Button>
          <h2 className="text-3xl font-bold text-foreground mb-2">Importar Alunos via CSV</h2>
          <p className="text-muted-foreground">Importe múltiplos alunos através de arquivo CSV</p>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Upload className="h-5 w-5" />
                Upload de Arquivo CSV
              </CardTitle>
              <CardDescription>Selecione um arquivo CSV com os dados dos alunos</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div
                className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                  isDragging
                    ? "border-primary bg-primary/5"
                    : file
                      ? "border-green-500 bg-green-500/5"
                      : "hover:border-primary"
                }`}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
              >
                <input
                  type="file"
                  accept=".csv"
                  onChange={handleFileChange}
                  className="hidden"
                  id="file-upload"
                  disabled={importing}
                />
                <label htmlFor="file-upload" className={importing ? "cursor-not-allowed" : "cursor-pointer"}>
                  <div className="flex flex-col items-center gap-3">
                    {file ? (
                      <>
                        <CheckCircle className="h-12 w-12 text-green-500" />
                        <p className="font-medium text-foreground">{file.name}</p>
                        <p className="text-sm text-muted-foreground">{parsedStudents.length} aluno(s) encontrado(s)</p>
                        {!importing && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.preventDefault()
                              clearFile()
                            }}
                          >
                            <X className="h-4 w-4 mr-1" />
                            Remover arquivo
                          </Button>
                        )}
                      </>
                    ) : (
                      <>
                        <Upload className="h-12 w-12 text-muted-foreground" />
                        <p className="font-medium text-foreground">Clique ou arraste o arquivo CSV</p>
                        <p className="text-sm text-muted-foreground">Formato aceito: .csv</p>
                      </>
                    )}
                  </div>
                </label>
              </div>

              {importing && (
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Importando...</span>
                    <span>{Math.round(importProgress)}%</span>
                  </div>
                  <Progress value={importProgress} />
                  <p className="text-sm text-muted-foreground">
                    {importedCount} importado(s), {errorCount} erro(s)
                  </p>
                </div>
              )}

              <div className="flex gap-2">
                <Button variant="outline" onClick={downloadTemplate} className="flex-1 bg-transparent">
                  <Download className="h-4 w-4 mr-2" />
                  Baixar Modelo CSV
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Instruções</CardTitle>
              <CardDescription>Formato esperado do arquivo CSV</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <h4 className="font-semibold text-sm mb-2">Colunas do CSV (na ordem):</h4>
                  <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
                    <li>
                      <strong>nome</strong> - Nome completo do aluno *
                    </li>
                    <li>
                      <strong>rg</strong> - RG do aluno
                    </li>
                    <li>
                      <strong>dataNascimento</strong> - Data (DD/MM/AAAA)
                    </li>
                    <li>
                      <strong>responsavel</strong> - Nome do responsável *
                    </li>
                    <li>
                      <strong>cpfResponsavel</strong> - CPF do responsável
                    </li>
                    <li>
                      <strong>emailResponsavel</strong> - Email do responsável
                    </li>
                    <li>
                      <strong>telefonePai</strong> - Telefone do pai
                    </li>
                    <li>
                      <strong>telefoneMae</strong> - Telefone da mãe
                    </li>
                    <li>
                      <strong>mensalidade</strong> - Valor da mensalidade *
                    </li>
                    <li>
                      <strong>bolsista</strong> - "sim" ou "não"
                    </li>
                  </ul>
                  <p className="text-xs text-muted-foreground mt-2">* Campos obrigatórios</p>
                </div>

                <div className="p-4 rounded-lg bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800">
                  <div className="flex gap-2">
                    <AlertCircle className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                    <div className="text-sm text-blue-900 dark:text-blue-100">
                      <p className="font-semibold mb-1">Dica:</p>
                      <p>
                        A primeira linha do CSV deve conter os cabeçalhos das colunas. Alunos com nomes duplicados serão
                        ignorados.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {parsedStudents.length > 0 && (
          <Card className="mt-6">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    Preview dos Dados ({parsedStudents.length} alunos)
                  </CardTitle>
                  <CardDescription>Revise os dados antes de importar</CardDescription>
                </div>
                <div className="flex gap-2">
                  <Badge variant="outline" className="bg-green-500/10 text-green-600 border-green-500/20">
                    {validCount} válidos
                  </Badge>
                  {invalidCount > 0 && (
                    <Badge variant="outline" className="bg-destructive/10 text-destructive border-destructive/20">
                      {invalidCount} com erros
                    </Badge>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto max-h-[400px] overflow-y-auto border rounded-lg">
                <Table>
                  <TableHeader className="sticky top-0 bg-background z-10">
                    <TableRow>
                      <TableHead className="w-[40px]">Status</TableHead>
                      <TableHead>Nome</TableHead>
                      <TableHead>RG</TableHead>
                      <TableHead>Nascimento</TableHead>
                      <TableHead>Responsável</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead className="text-right">Mensalidade</TableHead>
                      <TableHead>Bolsista</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {parsedStudents.map((student, index) => (
                      <TableRow key={index} className={!student.isValid ? "bg-destructive/5" : ""}>
                        <TableCell>
                          {student.isValid ? (
                            <CheckCircle className="h-4 w-4 text-green-500" />
                          ) : (
                            <AlertCircle className="h-4 w-4 text-destructive" title={student.errors.join(", ")} />
                          )}
                        </TableCell>
                        <TableCell className="font-medium">{student.name || "-"}</TableCell>
                        <TableCell className="text-muted-foreground">{student.rg || "-"}</TableCell>
                        <TableCell className="text-muted-foreground">{student.birthDate || "-"}</TableCell>
                        <TableCell>{student.responsible || "-"}</TableCell>
                        <TableCell className="text-muted-foreground">{student.responsibleEmail || "-"}</TableCell>
                        <TableCell className="text-right">
                          {student.isScholarship ? (
                            <Badge variant="secondary">Bolsista</Badge>
                          ) : (
                            `R$ ${student.monthlyValue.toFixed(2)}`
                          )}
                        </TableCell>
                        <TableCell>
                          {student.isScholarship ? (
                            <Badge variant="outline" className="bg-blue-500/10 text-blue-600">
                              Sim
                            </Badge>
                          ) : (
                            <span className="text-muted-foreground">Não</span>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              <div className="flex gap-3 justify-end mt-6">
                <Button variant="outline" onClick={clearFile} disabled={importing}>
                  Cancelar
                </Button>
                <Button onClick={handleImport} disabled={importing || validCount === 0}>
                  {importing ? (
                    <>
                      <FileSpreadsheet className="h-4 w-4 mr-2 animate-pulse" />
                      Importando...
                    </>
                  ) : (
                    <>
                      <Upload className="h-4 w-4 mr-2" />
                      Importar {validCount} Aluno(s)
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  )
}
