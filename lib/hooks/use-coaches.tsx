"use client"

import { coachesData } from "@/lib/data/coaches"
import type { Coach, ClassInfo } from "@/lib/data/coaches"

interface CoachesStore {
  getCoach: (id: string) => Coach | undefined
  getCoachByUsername: (username: string) => Coach | undefined
  getCoachClasses: (coachId: string) => ClassInfo[]
}

export const useCoaches = (): CoachesStore => {
  const getCoach = (id: string): Coach | undefined => {
    return coachesData.find((coach) => coach.id === id)
  }

  const getCoachByUsername = (username: string): Coach | undefined => {
    return coachesData.find((coach) => coach.username === username)
  }

  const getCoachClasses = (coachId: string): ClassInfo[] => {
    const coach = getCoach(coachId)
    return coach?.classes || []
  }

  return {
    getCoach,
    getCoachByUsername,
    getCoachClasses,
  }
}
