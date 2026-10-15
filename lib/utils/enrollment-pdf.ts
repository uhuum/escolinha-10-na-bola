import { jsPDF } from "jspdf"
import type { Student, DayScheduleConfig } from "@/lib/types"
import { formatCurrency } from "@/lib/utils/currency"
import { formatRG, formatCPF, formatPhone, detectDocumentType } from "@/lib/utils/input-masks"

/** Imagens são carregadas localmente para preservar o arquivo e a proporção da logo. */
async function loadImage(src: string): Promise<{ data: string; w: number; h: number } | null> {
  try {
    return await new Promise((resolve) => {
      const image = new Image()
      image.crossOrigin = "anonymous"
      image.onload = () => {
        try {
          const canvas = document.createElement("canvas")
          canvas.width = image.naturalWidth
          canvas.height = image.naturalHeight
          const ctx = canvas.getContext("2d")
          if (!ctx) { resolve(null); return }
          ctx.drawImage(image, 0, 0)
          resolve({ data: canvas.toDataURL("image/png"), w: image.naturalWidth, h: image.naturalHeight })
        } catch { resolve(null) }
      }
      image.onerror = () => resolve(null)
      image.src = src
    })
  } catch { return null }
}

function dateBR(input?: string) {
  if (!input) return "Não informado"
  if (/^\d{4}-\d{2}-\d{2}/.test(input)) {
    const [year, month, day] = input.slice(0, 10).split("-")
    return day + "/" + month + "/" + year
  }
  return input
}

function scheduleText(student: Student) {
  const schedules: DayScheduleConfig[] = student.scheduleConfigs?.length
    ? student.scheduleConfigs
    : (student.classDays || []).map(day => ({ day, schedule: student.classSchedule || "18:00-19:30" }))
  return schedules.length
    ? schedules.map(s => s.day + " • " + s.schedule.replace("-", " às ")).join(" | ")
    : "A confirmar com o administrativo"
}

export async function generateEnrollmentPdf(student: Student): Promise<void> {
  const pdf = new jsPDF({ unit: "mm", format: "a4" })
  const W = 210, H = 297, left = 18, right = 192
  const navy: [number, number, number] = [16, 31, 64]
  const red: [number, number, number] = [203, 34, 57]
  const text: [number, number, number] = [29, 45, 73]
  const muted: [number, number, number] = [105, 119, 141]
  const pale: [number, number, number] = [246, 248, 252]

  const setColor = (color: [number, number, number]) => pdf.setTextColor(...color)
  const write = (value: string, x: number, y: number, size = 10, bold = false, color = text) => {
    pdf.setFont("helvetica", bold ? "bold" : "normal")
    pdf.setFontSize(size)
    setColor(color)
    pdf.text(value, x, y)
  }

  pdf.setFillColor(...navy)
  pdf.rect(0, 0, W, 61, "F")
  pdf.setFillColor(...red)
  pdf.rect(0, 61, W, 2, "F")

  // Caixa neutra destaca o escudo original sem deformar.
  pdf.setFillColor(255, 255, 255)
  pdf.roundedRect(left, 11, 38, 38, 4, 4, "F")
  const logo = await loadImage("/logo-ceap.png")
  if (logo) {
    const max = 34
    const scale = Math.min(max / logo.w, max / logo.h)
    const w = logo.w * scale, h = logo.h * scale
    pdf.addImage(logo.data, "PNG", left + (38 - w) / 2, 11 + (38 - h) / 2, w, h)
  }

  write("10 NA BOLA", 64, 24, 20, true, [255, 255, 255])
  write("ESCOLA DE FUTEBOL", 64, 32, 10, true, [230, 235, 245])
  write("COMPROVANTE DE MATRÍCULA", 64, 44, 10, true, [255, 210, 220])

  const today = new Date().toLocaleDateString("pt-BR", { timeZone: "America/Sao_Paulo", day: "2-digit", month: "2-digit", year: "numeric" })
  pdf.setFillColor(234, 248, 239)
  pdf.roundedRect(left, 71, W - left * 2, 22, 3, 3, "F")
  write("MATRÍCULA APROVADA", left + 7, 80, 11, true, [29, 117, 74])
  write("Emissão: " + today, left + 7, 87, 8.5, false, [59, 105, 81])

  let y = 104
  const section = (title: string, rows: Array<[string, string]>) => {
    pdf.setFillColor(...navy)
    pdf.roundedRect(left, y, W - left * 2, 9, 1.6, 1.6, "F")
    write(title.toUpperCase(), left + 5, y + 6, 9, true, [255, 255, 255])
    y += 11

    for (const [label, value] of rows) {
      const safeValue = String(value || "Não informado")
      pdf.setFont("helvetica", "normal")
      pdf.setFontSize(9.5)
      const wrapped = pdf.splitTextToSize(safeValue, 110) as string[]
      const rowHeight = Math.max(11, wrapped.length * 4.4 + 4)
      if (y + rowHeight > H - 28) {
        pdf.addPage()
        y = 19
      }
      pdf.setFillColor(...pale)
      pdf.roundedRect(left, y, W - left * 2, rowHeight - 1, 1, 1, "F")
      write(label, left + 4, y + 6.7, 8.6, true, muted)
      pdf.setFont("helvetica", "normal")
      pdf.setFontSize(9.4)
      setColor(text)
      pdf.text(wrapped, left + 61, y + 6.5)
      y += rowHeight
    }
    y += 5
  }

  const document = student.rg || "Não informado"
  const documentLabel = detectDocumentType(document) === "CPF" ? "CPF do aluno" : "Documento do aluno"
  const formattedDocument = student.rg
    ? (detectDocumentType(student.rg) === "CPF" ? formatCPF(student.rg) : formatRG(student.rg))
    : "Não informado"

  section("Identificação do aluno", [
    ["Nome completo", student.name || "Não informado"],
    ["Data de nascimento", dateBR(student.birthDate)],
    [documentLabel, formattedDocument],
  ])

  section("Responsável e contatos", [
    ["Responsável", student.responsible || "Não informado"],
    ["CPF do responsável", student.responsibleCpf ? formatCPF(student.responsibleCpf) : "Não informado"],
    ["E-mail", student.responsibleEmail || "Não informado"],
    ["Telefone do pai", student.fatherPhone ? formatPhone(student.fatherPhone) : "Não informado"],
    ["Telefone da mãe", student.motherPhone ? formatPhone(student.motherPhone) : "Não informado"],
  ])

  section("Treinos e mensalidade", [
    ["Dias e horários", scheduleText(student)],
    ["Mensalidade", student.isScholarship ? "Bolsa integral" : formatCurrency(student.monthlyValue || 0)],
    ["Dia de vencimento", student.paymentDueDay ? String(student.paymentDueDay).padStart(2, "0") + " de cada mês" : "A confirmar"],
    ["Situação", "Matrícula aprovada e ativa"],
  ])

  if (y + 20 > H - 18) { pdf.addPage(); y = 19 }
  pdf.setDrawColor(222, 228, 238)
  pdf.line(left, y + 2, right, y + 2)
  pdf.setFont("helvetica", "normal")
  pdf.setFontSize(8.5)
  setColor(muted)
  pdf.text(pdf.splitTextToSize("Documento emitido pela Escola de Futebol 10 na Bola após a aprovação administrativa da matrícula. Não é necessário assinar este comprovante.", W - left * 2), left, y + 9)

  const pageCount = pdf.getNumberOfPages()
  for (let page = 1; page <= pageCount; page++) {
    pdf.setPage(page)
    pdf.setDrawColor(221, 226, 235)
    pdf.line(left, H - 17, right, H - 17)
    write("10 NA BOLA  •  MATRÍCULA DIGITAL", left, H - 11, 7.7, true, navy)
    write("Página " + page + " de " + pageCount, right - 22, H - 11, 7.6, false, muted)
  }

  const safeName = (student.name || "aluno").replace(/[^\p{L}\p{N}]+/gu, "-").toLowerCase()
  pdf.save("comprovante-interno-matricula-" + safeName + ".pdf")
}
