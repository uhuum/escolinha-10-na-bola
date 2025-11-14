"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from 'next/navigation'
import { useStudents } from "@/lib/hooks/use-students"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ArrowLeft, Save, UserPlus, Camera } from 'lucide-react'
import Link from "next/link"
import { useToast } from "@/hooks/use-toast"
import type { ClassSchedule, WeekDay } from "@/lib/types"
import { Checkbox } from "@/components/ui/checkbox"
import Image from "next/image"
import { AppHeader } from "@/components/app-header"
import { AppFooter } from "@/components/app-footer"
import { formatCPF, formatRG, formatPhone } from "@/lib/utils/input-masks"
import { PhotoCropModal } from "@/components/photo-crop-modal"

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
    classSchedule: "18:00-19:30" as ClassSchedule,
    classDays: [] as WeekDay[],
  })

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
        monthlyValue: Number.parseFloat(formData.monthlyValue),
        isActive: true,
        classSchedule: formData.classSchedule,
        classDays: formData.classDays,
        photo: photoPreview,
        payments: [], // Will be created by the hook
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

  const toggleClassDay = (day: WeekDay) => {
    setFormData((prev) => ({
      ...prev,
      classDays: prev.classDays.includes(day) ? prev.classDays.filter((d) => d !== day) : [...prev.classDays, day],
    }))
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
                <CardDescription className="text-sm">Horário e dias de aula</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3 sm:space-y-4 p-4 sm:p-6 pt-0">
                <div className="grid gap-3 sm:gap-4 grid-cols-1 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="classSchedule" className="text-sm">
                      Horário da Turma
                    </Label>
                    <Select
                      value={formData.classSchedule}
                      onValueChange={(value) => setFormData({ ...formData, classSchedule: value as ClassSchedule })}
                    >
                      <SelectTrigger className="h-10 sm:h-11 text-sm">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="18:00-19:30" className="text-sm">
                          Primeiro Horário (18:00 - 19:30)
                        </SelectItem>
                        <SelectItem value="19:30-21:00" className="text-sm">
                          Segundo Horário (19:30 - 21:00)
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
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
                      className="h-10 sm:h-11 text-sm"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-sm">Dias da Semana</Label>
                  <div className="flex flex-wrap gap-3 sm:gap-4">
                    {weekDays.map((day) => (
                      <div key={day} className="flex items-center space-x-2">
                        <Checkbox
                          id={day}
                          checked={formData.classDays.includes(day)}
                          onCheckedChange={() => toggleClassDay(day)}
                        />
                        <Label htmlFor={day} className="cursor-pointer text-sm">
                          {day}
                        </Label>
                      </div>
                    ))}
                  </div>
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

      <AppFooter />
    </div>
  )
}
