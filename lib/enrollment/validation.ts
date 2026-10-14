import { z } from "zod"

export const weekDays = ["Segunda", "Terça", "Quarta", "Quinta", "Sexta"] as const
export const schedules = ["18:00-19:30", "19:30-21:00"] as const
export const privacyVersion = "2026-10-14"
const name = z.string().trim().min(5, "Informe o nome completo.").max(150)
const phone = z.string().transform((v) => v.replace(/\D/g, "")).pipe(z.string().regex(/^\d{10,11}$/, "Informe o telefone com DDD."))
export function validCpf(value: string) {
  const digits = value.replace(/\D/g, "")
  if (!/^\d{11}$/.test(digits) || /^(\d)\1{10}$/.test(digits)) return false
  for (let length = 9; length <= 10; length++) {
    const sum = [...digits.slice(0, length)].reduce((total, digit, index) => total + Number(digit) * (length + 1 - index), 0)
    const remainder = (sum * 10) % 11
    if ((remainder === 10 ? 0 : remainder) !== Number(digits[length])) return false
  }
  return true
}
export const enrollmentSchema = z.object({
  name,
  documentType: z.enum(["CPF", "RG"]),
  document: z.string().trim().min(5).max(25),
  birthDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Informe a data de nascimento.").refine((v) => {
    const parsed = new Date(`${v}T12:00:00Z`)
    return !isNaN(parsed.getTime()) && parsed.toISOString().slice(0, 10) === v && v >= "1900-01-01" && v <= new Date().toISOString().slice(0, 10)
  }, "Informe uma data de nascimento válida."),
  responsible: name,
  responsibleCpf: z.string().transform((v) => v.replace(/\D/g, "")).refine(validCpf, "Confira o CPF do responsável."),
  email: z.string().trim().email("Confira o e-mail.").max(200),
  phone,
  emergencyName: name,
  emergencyRelationship: z.string().trim().min(2).max(60),
  emergencyPhone: phone,
  dueDay: z.number().int().min(1).max(28),
  healthNotes: z.string().trim().max(2000).default(""),
  confirmed: z.literal(true, { errorMap: () => ({ message: "Confirme que os dados estão corretos." }) }),
}).strict().superRefine((data, ctx) => {
  if (data.documentType === "CPF" && !validCpf(data.document)) ctx.addIssue({ code: "custom", path: ["document"], message: "Confira o CPF do aluno." })
})
export const approvalSchema = z.object({
  category: z.string().regex(/^Sub-(08|09|10|11|12|13|14|15|16)$/, "Selecione a categoria."),
  monthlyValue: z.number().int().min(0).max(10000),
  dueDay: z.number().int().min(1).max(28),
  scheduleConfigs: z.array(z.object({ day: z.enum(weekDays), schedule: z.enum(schedules) }).strict()).min(1).max(5)
    .refine((v) => new Set(v.map((s) => s.day)).size === v.length, "Não repita dias de treino."),
}).strict()
export type EnrollmentData = z.infer<typeof enrollmentSchema>
export type ApprovalData = z.infer<typeof approvalSchema>
export type EnrollmentRequest = {
  id: string; label: string; status: "invited" | "pending" | "approved" | "cancelled";
  created_at: string; expires_at: string; submitted_at: string | null;
  payload: EnrollmentData | null; approval: ApprovalData | null;
  student_id: string | null; approved_at: string | null;
}
