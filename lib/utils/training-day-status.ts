export type TrainingSlotStatus = "realizado" | "cancelado" | "pendente"
export type TrainingDayStatus = TrainingSlotStatus | "misto" | "neutro"

/** Um registro pertence ao horário específico, não ao dia inteiro. */
export function getTrainingSlotStatus(
  schedule: string,
  attendedSchedules: readonly string[],
  cancelledSchedules: readonly string[],
): TrainingSlotStatus {
  if (attendedSchedules.includes(schedule)) return "realizado"
  if (cancelledSchedules.includes(schedule)) return "cancelado"
  return "pendente"
}

/** Sábados e domingos são neutros; dias úteis sem registros ficam pendentes. */
export function getTrainingDayStatus(
  dayOfWeek: number,
  scheduledTimes: readonly string[],
  attendedSchedules: readonly string[],
  cancelledSchedules: readonly string[],
): TrainingDayStatus {
  if (dayOfWeek === 0 || dayOfWeek === 6 || scheduledTimes.length === 0) return "neutro"
  const statuses = scheduledTimes.map((schedule) =>
    getTrainingSlotStatus(schedule, attendedSchedules, cancelledSchedules),
  )
  const uniqueStatuses = new Set(statuses)
  return uniqueStatuses.size === 1 ? statuses[0] : "misto"
}
