"use client"

import type React from "react"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { useStudents } from "@/lib/hooks/use-students"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ArrowLeft, Save, UserPlus, Camera, Plus, Trash2 } from "lucide-react"
import Link from "next/link"
import { useToast } from "@/hooks/use-toast"
import type { ClassSchedule, WeekDay, DayScheduleConfig } from "@/lib/types"
import { Checkbox } from "@/components/ui/checkbox"
import Image from "next/image"
import { AppHeader } from "@/components/app-header"
import { PhotoCropModal } from "@/components/photo-crop-modal"
import { formatRG, formatCPF, formatPhone } from "@/lib/formatters" // Added imports for format functions

export default function NewStudentPage() {
  const router = useRouter()
  const { addStudent } = useStudents()
  const { toast } = useToast()

  const [formData, setFormData] = useState({
    name: "",
    rg: "",
    birthDate: "",
    responsible: "",
    responsibleCpf: "",
    responsibleEmail: "",
    fatherPhone: "",
    motherPhone: "",
    monthlyValue: "100",
    isScholarship: false, // Added scholarship field
  })

  const [scheduleConfigs, setScheduleConfigs] = useState<DayScheduleConfig[]>([
    { day: "Segunda", schedule: "18:00-19:30" },
  ])

  const [photoPreview, setPhotoPreview] = useState<string>("/diverse-students.png")
  const [showCropModal, setShowCropModal] = useState(false)
  const [tempPhotoForCrop, setTempPhotoForCrop] = useState<string>("")
  const [isSaving, setIsSaving] = useState(false)

  const weekDays: WeekDay[] = ["Segunda", "Terça", "Quarta", "Quinta", "Sexta"]

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onloadend = () => {
        const result = reader.result as string
        setTempPhotoForCrop(result)
        setShowCropModal(true)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleCropComplete = (croppedImage: string) => {
    setPhotoPreview(croppedImage)
    setShowCropModal(false)
    setTempPhotoForCrop("")
    toast({
      title: "Foto ajustada",
      description: "Sua foto foi cortada com sucesso.",
    })
  }

  const addScheduleConfig = () => {
    // Find a day that hasn't been used yet
    const usedDays = scheduleConfigs.map((c) => c.day)
    const availableDay = weekDays.find((d) => !usedDays.includes(d))

    if (!availableDay) {
      toast({
        title: "Erro",
        description: "Todos os dias já foram configurados.",
        variant: "destructive",
      })
      return
    }

    setScheduleConfigs([...scheduleConfigs, { day: availableDay, schedule: "18:00-19:30" }])
  }

  const removeScheduleConfig = (index: number) => {
    if (scheduleConfigs.length > 1) {
      setScheduleConfigs(scheduleConfigs.filter((_, i) => i !== index))
    }
  }

  const updateConfigDay = (index: number, day: WeekDay) => {
    // Check if day is already used in another config
    const isDayUsed = scheduleConfigs.some((config, i) => i !== index && config.day === day)

    if (isDayUsed) {
      const existingConfig = scheduleConfigs.find((c, i) => i !== index && c.day === day)
      toast({
        title: "Dia já utilizado",
        description: `${day} já está configurado com horário ${existingConfig?.schedule}. Escolha outro dia.`,
        variant: "destructive",
      })
      return
    }

    const newConfigs = [...scheduleConfigs]
    newConfigs[index].day = day
    setScheduleConfigs(newConfigs)
  }

  const updateConfigSchedule = (index: number, schedule: ClassSchedule) => {
    const config = scheduleConfigs[index]
    // Check if same day+schedule combination exists
    const isDuplicate = scheduleConfigs.some((c, i) => i !== index && c.day === config.day && c.schedule === schedule)

    if (isDuplicate) {
      toast({
        title: "Configuração duplicada",
        description: `${config.day} no horário ${schedule} já está configurado.`,
        variant: "destructive",
      })
      return
    }

    const newConfigs = [...scheduleConfigs]
    newConfigs[index].schedule = schedule
    setScheduleConfigs(newConfigs)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.name || !formData.responsible || !formData.responsibleCpf) {
      toast({
        title: "Erro",
        description: "Preencha todos os campos obrigatórios",
        variant: "destructive",
      })
      return
    }

    const seen = new Set<string>()
    for (const config of scheduleConfigs) {
      const key = `${config.day}-${config.schedule}`
      if (seen.has(key)) {
        toast({
          title: "Erro",
          description: `Configuração duplicada: ${config.day} no horário ${config.schedule}`,
          variant: "destructive",
        })
        return
      }
      seen.add(key)
    }

    const allDays: WeekDay[] = [...new Set(scheduleConfigs.map((c) => c.day))]
    const primarySchedule = scheduleConfigs[0]?.schedule || "18:00-19:30"

    try {
      setIsSaving(true)
      const newStudent = {
        name: formData.name,
        rg: formData.rg,
        birthDate: formData.birthDate,
        responsible: formData.responsible,
        responsibleCpf: formData.responsibleCpf,
        responsibleEmail: formData.responsibleEmail,
        fatherPhone: formData.fatherPhone,
        motherPhone: formData.motherPhone,
        monthlyValue: formData.isScholarship ? 0 : Number.parseFloat(formData.monthlyValue),
        isActive: true,
        isScholarship: formData.isScholarship,
        classSchedule: primarySchedule,
        classDays: allDays,
        scheduleConfigs: scheduleConfigs,
        photo: photoPreview,
        payments: [],
      }

      await addStudent(newStudent)

      toast({
        title: "Aluno cadastrado!",
        description: `${formData.name} foi adicionado com sucesso.`,
      })

      router.push("/students")
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao cadastrar aluno. Tente novamente.",
        variant: "destructive",
      })
      console.error("Error adding student:", error)
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <AppHeader />

      <main className="container mx-auto px-3 sm:px-4 md:px-6 lg:px-8 py-4 sm:py-6 lg:py-8 max-w-4xl flex-1">
        <div className="mb-6 sm:mb-8">
          <Button asChild variant="ghost" className="mb-3 sm:mb-4 -ml-2 text-sm sm:text-base h-9 sm:h-10">
            <Link href="/students">
              <ArrowLeft className="mr-2 h-3.5 w-3.5 sm:h-4 sm:w-4" />
              Voltar para Lista de Alunos
            </Link>
          </Button>
          <h2 className="text-2xl sm:text-3xl font-bold text-foreground mb-2">Cadastrar Novo Aluno</h2>
          <p className="text-sm sm:text-base text-muted-foreground">Preencha os dados do aluno e do responsável</p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="space-y-4 sm:space-y-6">
            {/* Foto do Aluno */}
            <Card>
              <CardHeader className="p-4 sm:p-6">
                <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                  <Camera className="h-4 w-4 sm:h-5 sm:w-5" />
                  Foto do Aluno
                </CardTitle>
                <CardDescription className="text-sm">Adicione uma foto para identificação</CardDescription>
              </CardHeader>
              <CardContent className="p-4 sm:p-6 pt-0">
                <div className="flex flex-col items-center gap-3 sm:gap-4">
                  <div className="relative h-32 w-32 sm:h-40 sm:w-40 rounded-full overflow-hidden bg-muted border-4 border-primary/20">
                    <Image
                      src={photoPreview || "/placeholder.svg"}
                      alt="Preview da foto"
                      fill
                      className="object-cover"
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      asChild
                      className="text-xs sm:text-sm h-9 sm:h-10 bg-transparent"
                    >
                      <label htmlFor="photo-upload" className="cursor-pointer">
                        <Camera className="mr-2 h-3.5 w-3.5 sm:h-4 sm:w-4" />
                        Escolher Foto
                        <input
                          id="photo-upload"
                          type="file"
                          accept="image/*"
                          onChange={handlePhotoChange}
                          className="hidden"
                        />
                      </label>
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground text-center">
                    Formatos aceitos: JPG, PNG, GIF (máx. 5MB)
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Dados do Aluno */}
            <Card>
              <CardHeader className="p-4 sm:p-6">
                <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                  <UserPlus className="h-4 w-4 sm:h-5 sm:w-5" />
                  Dados do Aluno
                </CardTitle>
                <CardDescription className="text-sm">Informações pessoais do aluno</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3 sm:space-y-4 p-4 sm:p-6 pt-0">
                <div className="grid gap-3 sm:gap-4 grid-cols-1 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="name" className="text-sm">
                      Nome Completo *
                    </Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="Nome completo do aluno"
                      required
                      className="h-10 sm:h-11 text-sm"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="rg" className="text-sm">
                      RG
                    </Label>
                    <Input
                      id="rg"
                      value={formData.rg}
                      onChange={(e) => setFormData({ ...formData, rg: formatRG(e.target.value) })}
                      placeholder="12.345.678-9 ou 12.345.67-X"
                      maxLength={14}
                      className="h-10 sm:h-11 text-sm"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="birthDate" className="text-sm">
                    Data de Nascimento
                  </Label>
                  <Input
                    id="birthDate"
                    type="date"
                    value={formData.birthDate}
                    onChange={(e) => {
                      if (e.target.value) {
                        setFormData({ ...formData, birthDate: e.target.value })
                      }
                    }}
                    className="h-10 sm:h-11 text-sm"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Dados do Responsável */}
            <Card>
              <CardHeader className="p-4 sm:p-6">
                <CardTitle className="text-base sm:text-lg">Dados do Responsável</CardTitle>
                <CardDescription className="text-sm">Informações do responsável financeiro</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3 sm:space-y-4 p-4 sm:p-6 pt-0">
                <div className="grid gap-3 sm:gap-4 grid-cols-1 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="responsible" className="text-sm">
                      Nome Completo *
                    </Label>
                    <Input
                      id="responsible"
                      value={formData.responsible}
                      onChange={(e) => setFormData({ ...formData, responsible: e.target.value })}
                      placeholder="Nome do responsável"
                      required
                      className="h-10 sm:h-11 text-sm"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="responsibleCpf" className="text-sm">
                      CPF *
                    </Label>
                    <Input
                      id="responsibleCpf"
                      value={formData.responsibleCpf}
                      onChange={(e) => setFormData({ ...formData, responsibleCpf: formatCPF(e.target.value) })}
                      placeholder="123.456.789-00"
                      maxLength={14}
                      required
                      className="h-10 sm:h-11 text-sm"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="responsibleEmail" className="text-sm">
                    E-mail
                  </Label>
                  <Input
                    id="responsibleEmail"
                    type="email"
                    value={formData.responsibleEmail}
                    onChange={(e) => setFormData({ ...formData, responsibleEmail: e.target.value })}
                    placeholder="email@exemplo.com"
                    className="h-10 sm:h-11 text-sm"
                  />
                </div>
                <div className="grid gap-3 sm:gap-4 grid-cols-1 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="fatherPhone" className="text-sm">
                      Telefone do Pai
                    </Label>
                    <Input
                      id="fatherPhone"
                      value={formData.fatherPhone}
                      onChange={(e) => setFormData({ ...formData, fatherPhone: formatPhone(e.target.value) })}
                      placeholder="(11) 98765-4321"
                      maxLength={15}
                      className="h-10 sm:h-11 text-sm"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="motherPhone" className="text-sm">
                      Telefone da Mãe
                    </Label>
                    <Input
                      id="motherPhone"
                      value={formData.motherPhone}
                      onChange={(e) => setFormData({ ...formData, motherPhone: formatPhone(e.target.value) })}
                      placeholder="(11) 98765-4321"
                      maxLength={15}
                      className="h-10 sm:h-11 text-sm"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Informações da Turma */}
            <Card>
              <CardHeader className="p-4 sm:p-6">
                <CardTitle className="text-base sm:text-lg">Informações da Turma</CardTitle>
                <CardDescription className="text-sm">Configure os dias e horários de aula do aluno</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 p-4 sm:p-6 pt-0">
                <div className="flex items-center space-x-3 p-4 rounded-lg border-2 border-dashed bg-accent/5">
                  <Checkbox
                    id="isScholarship"
                    checked={formData.isScholarship}
                    onCheckedChange={(checked) => setFormData({ ...formData, isScholarship: checked as boolean })}
                  />
                  <div className="flex-1">
                    <Label htmlFor="isScholarship" className="cursor-pointer text-sm font-medium">
                      Aluno Bolsista
                    </Label>
                    <p className="text-xs text-muted-foreground">
                      Marque se o aluno possui bolsa de estudos (mensalidade será R$ 0,00)
                    </p>
                  </div>
                </div>

                {!formData.isScholarship && (
                  <div className="space-y-2">
                    <Label htmlFor="monthlyValue" className="text-sm">
                      Valor da Mensalidade (R$)
                    </Label>
                    <Input
                      id="monthlyValue"
                      type="number"
                      step="0.01"
                      value={formData.monthlyValue}
                      onChange={(e) => setFormData({ ...formData, monthlyValue: e.target.value })}
                      placeholder="100.00"
                      className="h-10 sm:h-11 text-sm max-w-xs"
                    />
                  </div>
                )}

                <div className="space-y-3">
                  <Label className="text-sm font-medium">Dias e Horários de Aula</Label>

                  {scheduleConfigs.map((config, index) => (
                    <div key={index} className="flex flex-col sm:flex-row gap-3 p-4 rounded-lg border bg-card">
                      <div className="flex items-center gap-2 mb-2 sm:mb-0">
                        <span className="text-xs font-semibold text-muted-foreground whitespace-nowrap">
                          {index === 0 ? "Primeiro Dia" : `${index + 1}º Dia`}
                        </span>
                      </div>

                      <div className="flex-1 grid grid-cols-2 gap-3">
                        <Select value={config.day} onValueChange={(value) => updateConfigDay(index, value as WeekDay)}>
                          <SelectTrigger className="h-10 text-sm">
                            <SelectValue placeholder="Dia" />
                          </SelectTrigger>
                          <SelectContent>
                            {weekDays.map((day) => (
                              <SelectItem key={day} value={day} className="text-sm">
                                {day}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>

                        <Select
                          value={config.schedule}
                          onValueChange={(value) => updateConfigSchedule(index, value as ClassSchedule)}
                        >
                          <SelectTrigger className="h-10 text-sm">
                            <SelectValue placeholder="Horário" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="18:00-19:30" className="text-sm">
                              18:00 - 19:30
                            </SelectItem>
                            <SelectItem value="19:30-21:00" className="text-sm">
                              19:30 - 21:00
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      {scheduleConfigs.length > 1 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeScheduleConfig(index)}
                          className="h-10 w-10 p-0 text-destructive hover:text-destructive shrink-0"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  ))}

                  {scheduleConfigs.length < 5 && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={addScheduleConfig}
                      className="w-full sm:w-auto bg-transparent"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Adicionar Outro Dia
                    </Button>
                  )}

                  <p className="text-xs text-muted-foreground">
                    Cada dia pode ter apenas um horário. Ex: Terça às 18:00-19:30 e Quinta às 19:30-21:00.
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Actions */}
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 pb-4">
              <Button type="submit" size="lg" className="flex-1 h-11 sm:h-12 text-sm sm:text-base" disabled={isSaving}>
                {isSaving ? (
                  <span className="animate-pulse">Salvando...</span>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    Cadastrar Aluno
                  </>
                )}
              </Button>
              <Button
                type="button"
                variant="outline"
                size="lg"
                asChild
                className="h-11 sm:h-12 text-sm sm:text-base bg-transparent"
              >
                <Link href="/students">Cancelar</Link>
              </Button>
            </div>
          </div>
        </form>

        {/* Crop Modal */}
        <PhotoCropModal
          isOpen={showCropModal}
          imageSrc={tempPhotoForCrop}
          onCropComplete={handleCropComplete}
          onCancel={() => {
            setShowCropModal(false)
            setTempPhotoForCrop("")
          }}
        />
      </main>
    </div>
  )
}
