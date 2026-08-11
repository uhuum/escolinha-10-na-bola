import { jsPDF } from "jspdf"
import type { Student, DayScheduleConfig } from "@/lib/types"
import { formatCurrency } from "@/lib/utils/currency"
import { formatRG, formatCPF } from "@/lib/utils/input-masks"

/**
 * Carrega uma imagem (por URL ou dataURL) e retorna um objeto com o dataURL
 * em PNG e suas dimensões. Retorna null se falhar.
 */
async function loadImageAsDataUrl(
  src: string,
): Promise<{ dataUrl: string; width: number; height: number } | null> {
  try {
    return await new Promise((resolve, reject) => {
      const img = new Image()
      img.crossOrigin = "anonymous"
      img.onload = () => {
        try {
          const canvas = document.createElement("canvas")
          canvas.width = img.naturalWidth
          canvas.height = img.naturalHeight
          const ctx = canvas.getContext("2d")
          if (!ctx) {
            resolve(null)
            return
          }
          ctx.drawImage(img, 0, 0)
          resolve({
            dataUrl: canvas.toDataURL("image/png"),
            width: img.naturalWidth,
            height: img.naturalHeight,
          })
        } catch {
          resolve(null)
        }
      }
      img.onerror = () => reject(new Error("Falha ao carregar imagem"))
      img.src = src
    })
  } catch {
    return null
  }
}

/** Formata a data de nascimento (aceita YYYY-MM-DD ou já formatada). */
function formatBirthDate(birthDate?: string): string {
  if (!birthDate) return "Não informado"
  if (/^\d{4}-\d{2}-\d{2}/.test(birthDate)) {
    const [year, month, day] = birthDate.split("-")
    return `${day}/${month}/${year}`
  }
  return birthDate
}

/** Monta o texto dos dias e horários da escolinha. */
function formatSchedule(student: Student): string {
  const configs: DayScheduleConfig[] =
    student.scheduleConfigs && student.scheduleConfigs.length > 0
      ? student.scheduleConfigs
      : (student.classDays || []).map((day) => ({
          day,
          schedule: student.classSchedule || "18:00-19:30",
        }))

  if (configs.length === 0) return "Não informado"

  return configs.map((c) => `${c.day} (${c.schedule})`).join(", ")
}

/**
 * Gera e baixa um PDF com a declaração de matrícula do aluno.
 */
export async function generateEnrollmentPdf(student: Student): Promise<void> {
  const doc = new jsPDF({ unit: "mm", format: "a4" })
  const pageWidth = doc.internal.pageSize.getWidth()
  const pageHeight = doc.internal.pageSize.getHeight()
  const marginX = 20

  // Cores
  const primary: [number, number, number] = [21, 128, 61] // verde
  const dark: [number, number, number] = [30, 30, 30]
  const gray: [number, number, number] = [110, 110, 110]

  // ===== Logo =====
  const logo = await loadImageAsDataUrl("/logo-ceap.png")
  if (logo) {
    const logoW = 28
    const logoH = (logo.height / logo.width) * logoW
    doc.addImage(logo.dataUrl, "PNG", marginX, 14, logoW, logoH)
  }

  // ===== Cabeçalho =====
  doc.setFont("helvetica", "bold")
  doc.setFontSize(18)
  doc.setTextColor(...primary)
  doc.text("Escola de Futebol 10 na Bola", pageWidth - marginX, 22, { align: "right" })

  doc.setFont("helvetica", "normal")
  doc.setFontSize(10)
  doc.setTextColor(...gray)
  doc.text("Declaração de Matrícula", pageWidth - marginX, 29, { align: "right" })

  // Linha separadora
  doc.setDrawColor(...primary)
  doc.setLineWidth(0.8)
  doc.line(marginX, 40, pageWidth - marginX, 40)

  // ===== Título =====
  doc.setFont("helvetica", "bold")
  doc.setFontSize(16)
  doc.setTextColor(...dark)
  doc.text("DECLARAÇÃO DE MATRÍCULA", pageWidth / 2, 55, { align: "center" })

  // ===== Foto do aluno =====
  let contentTop = 68
  const photoSrc = student.photo || student.thumbnailUrl
  if (photoSrc) {
    const photo = await loadImageAsDataUrl(photoSrc)
    if (photo) {
      const photoW = 38
      const photoH = 48
      const photoX = pageWidth / 2 - photoW / 2
      // moldura
      doc.setDrawColor(...primary)
      doc.setLineWidth(0.6)
      doc.rect(photoX - 1, contentTop - 1, photoW + 2, photoH + 2)
      doc.addImage(photo.dataUrl, "PNG", photoX, contentTop, photoW, photoH)
      contentTop += photoH + 12
    }
  }

  // ===== Texto de confirmação =====
  doc.setFont("helvetica", "normal")
  doc.setFontSize(11)
  doc.setTextColor(...dark)
  const bodyText = `Declaramos, para os devidos fins, que o(a) aluno(a) ${student.name} encontra-se regularmente matriculado(a) na Escola de Futebol 10 na Bola, conforme os dados registrados abaixo.`
  const lines = doc.splitTextToSize(bodyText, pageWidth - marginX * 2)
  doc.text(lines, marginX, contentTop)
  contentTop += lines.length * 6 + 6

  // ===== Tabela de dados =====
  const rows: Array<[string, string]> = [
    ["Nome completo", student.name || "Não informado"],
    ["Data de nascimento", formatBirthDate(student.birthDate)],
    ["RG do aluno", student.rg ? formatRG(student.rg) : "Não informado"],
    ["Responsável", student.responsible || "Não informado"],
    ["CPF do responsável", student.responsibleCpf ? formatCPF(student.responsibleCpf) : "Não informado"],
    ["Dias e horários", formatSchedule(student)],
    ["Valor da mensalidade", formatCurrency(student.monthlyValue || 0)],
    ["Bolsista", student.isScholarship ? "Sim" : "Não"],
  ]

  const rowHeight = 11
  const labelW = 55
  let y = contentTop

  rows.forEach(([label, value], index) => {
    const bg = index % 2 === 0
    if (bg) {
      doc.setFillColor(244, 247, 244)
      doc.rect(marginX, y, pageWidth - marginX * 2, rowHeight, "F")
    }
    // label
    doc.setFont("helvetica", "bold")
    doc.setFontSize(10)
    doc.setTextColor(...primary)
    doc.text(label, marginX + 3, y + 7)
    // value
    doc.setFont("helvetica", "normal")
    doc.setTextColor(...dark)
    const valueLines = doc.splitTextToSize(value, pageWidth - marginX * 2 - labelW - 6)
    doc.text(valueLines, marginX + labelW, y + 7)
    y += rowHeight
  })

  // borda da tabela
  doc.setDrawColor(...primary)
  doc.setLineWidth(0.3)
  doc.rect(marginX, contentTop, pageWidth - marginX * 2, y - contentTop)

  // ===== Data e assinatura =====
  const today = new Date().toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  })
  y += 18
  doc.setFont("helvetica", "normal")
  doc.setFontSize(11)
  doc.setTextColor(...dark)
  doc.text(`Emitido em ${today}.`, marginX, y)

  y += 26
  const signW = 80
  const signX = pageWidth / 2 - signW / 2
  doc.setDrawColor(...dark)
  doc.setLineWidth(0.4)
  doc.line(signX, y, signX + signW, y)
  doc.setFontSize(10)
  doc.setTextColor(...gray)
  doc.text("Escola de Futebol 10 na Bola", pageWidth / 2, y + 6, { align: "center" })

  // ===== Rodapé =====
  doc.setFontSize(8)
  doc.setTextColor(...gray)
  doc.text(
    "Este documento confirma a matrícula do aluno na Escola de Futebol 10 na Bola.",
    pageWidth / 2,
    pageHeight - 14,
    { align: "center" },
  )

  const safeName = (student.name || "aluno").replace(/[^\p{L}\p{N}]+/gu, "-").toLowerCase()
  doc.save(`matricula-${safeName}.pdf`)
}
