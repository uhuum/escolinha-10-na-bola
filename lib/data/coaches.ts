// Coach/Trainer data structure with their assigned classes
import type { ClassSchedule, WeekDay } from "../types"

export interface Coach {
  id: string
  name: string
  username: string
  password: string
  classes: ClassInfo[]
}

export interface ClassInfo {
  schedule: ClassSchedule
  days: WeekDay[]
}

export const coachesData: Coach[] = [
  {
    id: "coach-1",
    name: "João da Silva",
    username: "treinador",
    password: "treinador123",
    classes: [
      { schedule: "18:00-19:30", days: ["Segunda", "Quarta", "Sexta"] },
      { schedule: "19:30-21:00", days: ["Terça", "Quinta"] },
    ],
  },
  {
    id: "coach-2",
    name: "Maria Santos",
    username: "treinador2",
    password: "treinador123",
    classes: [{ schedule: "19:30-21:00", days: ["Segunda", "Quarta", "Sexta"] }],
  },
]
