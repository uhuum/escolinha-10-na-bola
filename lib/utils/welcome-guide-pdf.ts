import { jsPDF } from "jspdf"
import type { Student, DayScheduleConfig } from "@/lib/types"
import { formatCurrency } from "@/lib/utils/currency"

type Color = [number, number, number]

const NAVY: Color = [19, 28, 77]
const RED: Color = [220, 37, 62]
const WHITE: Color = [255, 255, 255]
const INK: Color = [30, 42, 69]
const MUTED: Color = [103, 117, 141]
const SOFT: Color = [239, 242, 249]
const LIGHT_RED: Color = [252, 239, 241]
const W = 210
const H = 297
const MARGIN = 17

export function firstAndLastName(fullName: string): string {
  const names = (fullName || "").trim().replace(/\s+/g, " ").split(" ").filter(Boolean)
  if (names.length === 0) return "NOVO ALUNO"
  return names.length === 1 ? names[0] : names[0] + " " + names[names.length - 1]
}

function setFill(pdf: jsPDF, color: Color) { pdf.setFillColor(...color) }
function setInk(pdf: jsPDF, color: Color) { pdf.setTextColor(...color) }
function text(
  pdf: jsPDF, value: string, x: number, y: number,
  fontSize = 10, color: Color = INK, bold = false,
  align: "left" | "center" | "right" = "left",
) {
  pdf.setFont("helvetica", bold ? "bold" : "normal")
  pdf.setFontSize(fontSize)
  setInk(pdf, color)
  pdf.text(value, x, y, { align })
}
function paragraph(
  pdf: jsPDF, value: string, x: number, y: number, maxWidth: number,
  fontSize = 10, lineHeight = 5, color: Color = MUTED, bold = false,
) {
  pdf.setFont("helvetica", bold ? "bold" : "normal")
  pdf.setFontSize(fontSize)
  setInk(pdf, color)
  const lines: string[] = pdf.splitTextToSize(value, maxWidth)
  pdf.text(lines, x, y, { lineHeightFactor: lineHeight / (fontSize * 0.3528) })
  return y + lines.length * lineHeight
}
function card(pdf: jsPDF, x: number, y: number, w: number, h: number, color: Color = SOFT) {
  setFill(pdf, color)
  pdf.roundedRect(x, y, w, h, 3, 3, "F")
}
function brandedPage(pdf: jsPDF, title: string, page: number, section: string) {
  pdf.addPage()
  setFill(pdf, NAVY)
  pdf.rect(0, 0, W, 9, "F")
  setFill(pdf, RED)
  pdf.rect(0, 9, W, 1.5, "F")
  text(pdf, "10 NA BOLA", MARGIN, 24, 9.5, NAVY, true)
  text(pdf, section.toUpperCase(), W - MARGIN, 24, 8, MUTED, true, "right")
  pdf.setDrawColor(217, 225, 236)
  pdf.line(MARGIN, 30, W - MARGIN, 30)
  text(pdf, title, MARGIN, 46, 20, NAVY, true)
  pdf.setDrawColor(217, 225, 236)
  pdf.line(MARGIN, H - 20, W - MARGIN, H - 20)
  text(pdf, "ESCOLA DE FUTEBOL 10 NA BOLA", MARGIN, H - 12, 7.5, MUTED, true)
  text(pdf, page.toString().padStart(2, "0") + " / 04", W - MARGIN, H - 12, 7.5, MUTED, true, "right")
}

function schedulesOf(student: Student) {
  const entries: DayScheduleConfig[] = student.scheduleConfigs?.length
    ? student.scheduleConfigs
    : (student.classDays || []).map(day => ({ day, schedule: student.classSchedule || "18:00-19:30" }))
  return entries.filter(entry => entry.day && entry.schedule)
}

function scheduleLabel(value: string) {
  return value === "18:00-19:30" ? "18h às 19h30"
    : value === "19:30-21:00" ? "19h30 às 21h"
    : value.replace("-", " às ")
}

export function appendWelcomeGuide(pdf: jsPDF, student: Student): void {
  const studentName = firstAndLastName(student.name)
  const schedules = schedulesOf(student)

  // 01 / 04 — personalized cover
  pdf.addPage()
  setFill(pdf, NAVY)
  pdf.rect(0, 0, W, H, "F")
  setFill(pdf, RED)
  pdf.rect(0, 0, W, 5, "F")
  pdf.rect(0, H - 6, W, 6, "F")

  // Minimal visual crest, without outdated wording in the old logo.
  pdf.setDrawColor(...RED)
  pdf.setLineWidth(1.35)
  pdf.roundedRect(75, 37, 60, 54, 9, 9, "S")
  text(pdf, "10", 105, 66, 38, WHITE, true, "center")
  text(pdf, "NA BOLA", 105, 81, 10.8, WHITE, true, "center")
  text(pdf, "ESCOLA DE FUTEBOL", 105, 114, 9, [218, 224, 242], true, "center")
  setFill(pdf, RED)
  pdf.roundedRect(91, 121, 28, 1.8, 0.8, 0.8, "F")
  text(pdf, "BEM-VINDO,", 105, 151, 24, WHITE, true, "center")
  const maximumWidth = W - 30
  pdf.setFont("helvetica", "bold")
  let nameSize = 26
  while (nameSize > 14 && pdf.getTextWidth(studentName.toLocaleUpperCase("pt-BR")) * nameSize / pdf.getFontSize() > maximumWidth) {
    nameSize -= 1
    pdf.setFontSize(nameSize)
  }
  text(pdf, studentName.toLocaleUpperCase("pt-BR"), 105, 170, nameSize, WHITE, true, "center")
  text(pdf, "À ESCOLA DE FUTEBOL 10 NA BOLA", 105, 188, 12, [229, 232, 244], true, "center")
  text(pdf, "Este guia acompanha você e sua família", 105, 228, 10.5, WHITE, false, "center")
  text(pdf, "no início dessa nova jornada.", 105, 236, 10.5, WHITE, false, "center")
  text(pdf, "RESPEITO  •  DISCIPLINA  •  EVOLUÇÃO", 105, 273, 8.5, [229, 232, 244], true, "center")

  // 02 / 04 — Training
  brandedPage(pdf, "Seu treino, sua rotina.", 2, "Treinos e rotina")
  paragraph(pdf, "Nossos treinos são noturnos, das 18h às 21h, no campo do CEAP.", MARGIN, 57, 173, 10.8, 5.6, INK)
  card(pdf, MARGIN, 69, 176, 15)
  text(pdf, "CATEGORIAS", MARGIN + 8, 78.8, 8, RED, true)
  text(pdf, "Sub-08 ao Sub-16", W - MARGIN - 8, 79, 12, NAVY, true, "right")

  card(pdf, MARGIN, 91, 85, 36, NAVY)
  card(pdf, 108, 91, 85, 36, NAVY)
  text(pdf, "1º HORÁRIO", MARGIN + 9, 103, 8.3, [229, 233, 242], true)
  text(pdf, "18h às 19h30", MARGIN + 9, 116.5, 17, WHITE, true)
  text(pdf, "2º HORÁRIO", 117, 103, 8.3, [229, 233, 242], true)
  text(pdf, "19h30 às 21h", 117, 116.5, 16.5, WHITE, true)

  text(pdf, "Seus dias e horários", MARGIN, 138, 13, NAVY, true)
  const lines = schedules.length
    ? schedules.map(s => s.day + "  •  " + scheduleLabel(s.schedule))
    : ["Consulte o administrativo para confirmar seus dias de treino."]
  const scheduleHeight = Math.max(17, 9 + lines.length * 7)
  card(pdf, MARGIN, 143, 176, scheduleHeight, SOFT)
  lines.slice(0, 5).forEach((line, index) => {
    text(pdf, line, MARGIN + 8, 153 + index * 7, 10, INK, index === 0)
  })
  const nextY = 143 + scheduleHeight + 10
  text(pdf, "Organização e frequência", MARGIN, nextY, 12.4, NAVY, true)
  paragraph(pdf,
    "A Escola oferece planos de 1 ou 2 dias por semana. Frequências diferentes e eventuais ajustes são consultados com o administrativo.",
    MARGIN, nextY + 9, 176, 9.8, 5.1, MUTED)
  const changeY = nextY + 29
  card(pdf, MARGIN, changeY, 176, 34, SOFT)
  text(pdf, "Precisa trocar um dia?", MARGIN + 7, changeY + 10, 11, NAVY, true)
  paragraph(pdf,
    "Avise com antecedência. A troca depende de outro dia disponível da mesma categoria e deve ser alinhada com o administrativo.",
    MARGIN + 7, changeY + 18, 160, 9.2, 4.7, INK)
  const addressY = changeY + 40
  card(pdf, MARGIN, addressY, 176, 27, NAVY)
  text(pdf, "TREINOS NO CAMPO DE FUTEBOL DO CEAP", MARGIN + 8, addressY + 9, 8, [239, 194, 201], true)
  text(pdf, "R. José Viêira Martins, 270", MARGIN + 8, addressY + 19, 11, WHITE, true)

  // 03 / 04 — Values and competitions
  brandedPage(pdf, "Aprender. Jogar. Evoluir.", 3, "Jogos e evolução")
  text(pdf, "Cada aluno importa.", MARGIN, 59, 14, NAVY, true)
  paragraph(pdf,
    "Acompanhamos cada aluno de perto, respeitando seu ritmo, suas necessidades e suas conquistas.",
    MARGIN, 68, 176, 10.6, 5.6, MUTED)
  const values = ["RESPEITO", "DISCIPLINA", "EDUCAÇÃO", "AMIZADE"]
  values.forEach((value, index) => {
    const x = MARGIN + index * 45
    card(pdf, x, 91, 41, 18, SOFT)
    text(pdf, value, x + 20.5, 102, 8.2, NAVY, true, "center")
  })
  card(pdf, MARGIN, 122, 84, 59, SOFT)
  card(pdf, 109, 122, 84, 59, SOFT)
  text(pdf, "Campeonatos", MARGIN + 8, 136, 13, NAVY, true)
  paragraph(pdf, "Participação semestral, com jogos aos finais de semana.", MARGIN + 8, 149, 67, 10, 5.2)
  text(pdf, "Amistosos", 117, 136, 13, NAVY, true)
  paragraph(pdf, "Também acontecem aos finais de semana.", 117, 149, 67, 10, 5.2)
  text(pdf, "Ambos têm taxa de participação.", MARGIN, 195, 10.5, INK, true)
  paragraph(pdf, "Consulte os valores e as condições com o administrativo.", MARGIN, 202, 176, 10, 5.2)
  card(pdf, MARGIN, 213, 176, 32, NAVY)
  text(pdf, "PARA PARTICIPAR DOS CAMPEONATOS", MARGIN + 8, 223, 8.2, [239, 194, 201], true)
  text(pdf, "O desempenho conta.", MARGIN + 8, 234, 11, WHITE, true)
  text(pdf, "A frequência aos treinos tem ainda mais peso.", MARGIN + 8, 240, 9, WHITE)
  text(pdf, "Novos desafios para crescer", MARGIN, 256, 11, NAVY, true)
  paragraph(pdf,
    "Se o aluno se destaca, a equipe pode direcioná-lo a uma categoria mais forte para aperfeiçoamento.",
    MARGIN, 263, 176, 8.4, 3.8)

  // 04 / 04 — Family, payment and rain policy
  brandedPage(pdf, "Combinados importantes.", 4, "Família e escola")
  paragraph(pdf, "Organização e parceria dentro e fora de campo.", MARGIN, 58, 176, 10.6, 5.3)
  card(pdf, MARGIN, 77, 176, 51, SOFT)
  text(pdf, "Pagamentos em dia", MARGIN + 9, 89, 13, NAVY, true)
  paragraph(pdf,
    "Pagar dentro do prazo é essencial para a organização da Escola de Futebol 10 na Bola.",
    MARGIN + 9, 100, 157, 9.8, 5.1, MUTED)
  const payment = student.isScholarship
    ? "Mensalidade: bolsa integral."
    : "Mensalidade: " + formatCurrency(student.monthlyValue || 0) +
      (student.paymentDueDay ? "  |  Vencimento: dia " + String(student.paymentDueDay).padStart(2, "0") : "")
  text(pdf, payment, MARGIN + 9, 119, 9.4, NAVY, true)

  card(pdf, MARGIN, 145, 176, 81, LIGHT_RED)
  setFill(pdf, RED)
  pdf.roundedRect(MARGIN, 145, 2, 81, 1, 1, "F")
  text(pdf, "CAMPO DESCOBERTO", MARGIN + 9, 159, 8.3, RED, true)
  text(pdf, "E quando chove?", MARGIN + 9, 172, 14, NAVY, true)
  paragraph(pdf,
    "A chuva é um fenômeno da natureza que infelizmente não controlamos. Por segurança, chuva ou condições inadequadas do campo podem impedir a realização dos treinos.",
    MARGIN + 9, 184, 156, 10, 5.6, INK)
  paragraph(pdf,
    "Se houver cancelamento, converse com o administrativo para verificar uma possível reposição de aula, conforme a disponibilidade.",
    MARGIN + 9, 207, 156, 9.5, 5.1, NAVY, true)

  card(pdf, MARGIN, 239, 176, 30, NAVY)
  text(pdf, "FAMÍLIA E ESCOLA: O MESMO TIME", MARGIN + 9, 249, 8.4, [239, 194, 201], true)
  paragraph(pdf,
    "Acompanhe os avisos, incentive a frequência nos treinos e valorize cada etapa. Conte com nossa equipe!",
    MARGIN + 9, 258, 156, 9.5, 5, WHITE)
}

export function generateWelcomeGuidePdf(student: Student): void {
  const pdf = new jsPDF({ unit: "mm", format: "a4" })
  // appendWelcomeGuide always adds a page; remove the empty first page.
  appendWelcomeGuide(pdf, student)
  pdf.deletePage(1)
  const safeName = firstAndLastName(student.name).normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "").replace(/[^a-zA-Z0-9]+/g, "-").toLowerCase()
  pdf.save("boas-vindas-" + safeName + "-10-na-bola.pdf")
}
