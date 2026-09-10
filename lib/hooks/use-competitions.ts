"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { getBrowserClient } from "@/lib/supabase/client"

export type CompetitionType = "Campeonato" | "Amistoso"
export type CompetitionStatus = "Aberto" | "Encerrado"
export type CompetitionPaymentStatus = "Não Pago" | "Cobrado" | "Pago"
export type CompetitionPaymentType = "pix" | "dinheiro"

export interface Competition {
  id: string
  name: string
  type: CompetitionType
  eventDate: string
  feeValue: number
  category?: string
  opponent?: string
  location?: string
  notes?: string
  status: CompetitionStatus
  createdAt: string
  updatedAt: string
}

export interface CompetitionParticipant {
  id: string
  competitionId: string
  studentId: string
  paymentStatus: CompetitionPaymentStatus
  paymentType?: CompetitionPaymentType
  paidAt?: string
  chargedAt?: string
  receipt?: string
  createdAt: string
  updatedAt: string
}

const mapCompetition = (row: any): Competition => ({
  id: row.id,
  name: row.name,
  type: row.type,
  eventDate: row.event_date,
  feeValue: Number(row.fee_value || 0),
  category: row.category || undefined,
  opponent: row.opponent || undefined,
  location: row.location || undefined,
  notes: row.notes || undefined,
  status: row.status,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
})

const mapParticipant = (row: any): CompetitionParticipant => ({
  id: row.id,
  competitionId: row.competition_id,
  studentId: row.student_id,
  paymentStatus: row.payment_status,
  paymentType: row.payment_type || undefined,
  paidAt: row.paid_at || undefined,
  chargedAt: row.charged_at || undefined,
  receipt: row.receipt || undefined,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
})

export function useCompetitions() {
  const supabase = useMemo(() => getBrowserClient(), [])
  const [competitions, setCompetitions] = useState<Competition[]>([])
  const [participants, setParticipants] = useState<CompetitionParticipant[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const refresh = useCallback(async () => {
    setIsLoading(true)
    try {
      const [{ data: competitionRows, error: competitionError }, { data: participantRows, error: participantError }] =
        await Promise.all([
          supabase.from("competitions").select("*").order("event_date", { ascending: false }),
          supabase.from("competition_participants").select("*").order("created_at", { ascending: true }),
        ])

      if (competitionError) throw competitionError
      if (participantError) throw participantError
      setCompetitions((competitionRows || []).map(mapCompetition))
      setParticipants((participantRows || []).map(mapParticipant))
    } finally {
      setIsLoading(false)
    }
  }, [supabase])

  useEffect(() => {
    void refresh()
  }, [refresh])

  const createCompetition = useCallback(
    async (input: {
      name: string
      type: CompetitionType
      eventDate: string
      feeValue: number
      category?: string
      opponent?: string
      location?: string
      notes?: string
      studentIds: string[]
    }) => {
      const { data, error } = await supabase
        .from("competitions")
        .insert({
          name: input.name.trim(),
          type: input.type,
          event_date: input.eventDate,
          fee_value: Math.round(input.feeValue),
          category: input.category?.trim() || null,
          opponent: input.opponent?.trim() || null,
          location: input.location?.trim() || null,
          notes: input.notes?.trim() || null,
        })
        .select("*")
        .single()
      if (error) throw error

      if (input.studentIds.length > 0) {
        const { error: participantError } = await supabase.from("competition_participants").insert(
          input.studentIds.map((studentId) => ({ competition_id: data.id, student_id: studentId })),
        )
        if (participantError) {
          await supabase.from("competitions").delete().eq("id", data.id)
          throw participantError
        }
      }

      await refresh()
      return mapCompetition(data)
    },
    [refresh, supabase],
  )

  const updateCompetition = useCallback(
    async (id: string, changes: Partial<Pick<Competition, "name" | "type" | "eventDate" | "feeValue" | "category" | "opponent" | "location" | "notes" | "status">>) => {
      const payload: Record<string, unknown> = { updated_at: new Date().toISOString() }
      if (changes.name !== undefined) payload.name = changes.name.trim()
      if (changes.type !== undefined) payload.type = changes.type
      if (changes.eventDate !== undefined) payload.event_date = changes.eventDate
      if (changes.feeValue !== undefined) payload.fee_value = Math.round(changes.feeValue)
      if (changes.category !== undefined) payload.category = changes.category.trim() || null
      if (changes.opponent !== undefined) payload.opponent = changes.opponent.trim() || null
      if (changes.location !== undefined) payload.location = changes.location.trim() || null
      if (changes.notes !== undefined) payload.notes = changes.notes.trim() || null
      if (changes.status !== undefined) payload.status = changes.status

      const { error } = await supabase.from("competitions").update(payload).eq("id", id)
      if (error) throw error
      await refresh()
    },
    [refresh, supabase],
  )

  const deleteCompetition = useCallback(async (id: string) => {
    const { error } = await supabase.from("competitions").delete().eq("id", id)
    if (error) throw error
    await refresh()
  }, [refresh, supabase])

  const addParticipants = useCallback(async (competitionId: string, studentIds: string[]) => {
    if (!studentIds.length) return
    const { error } = await supabase.from("competition_participants").upsert(
      studentIds.map((studentId) => ({ competition_id: competitionId, student_id: studentId })),
      { onConflict: "competition_id,student_id", ignoreDuplicates: true },
    )
    if (error) throw error
    await refresh()
  }, [refresh, supabase])

  const removeParticipant = useCallback(async (participantId: string) => {
    const { error } = await supabase.from("competition_participants").delete().eq("id", participantId)
    if (error) throw error
    await refresh()
  }, [refresh, supabase])

  const setPaymentStatus = useCallback(async (
    participantId: string,
    status: CompetitionPaymentStatus,
    paymentType?: CompetitionPaymentType,
  ) => {
    const now = new Date().toISOString()
    const payload: Record<string, unknown> = {
      payment_status: status,
      updated_at: now,
    }

    if (status === "Pago") {
      payload.payment_type = paymentType || "pix"
      payload.paid_at = now
    } else {
      payload.payment_type = null
      payload.paid_at = null
    }
    if (status === "Cobrado") payload.charged_at = now
    if (status === "Não Pago") payload.charged_at = null

    const { error } = await supabase.from("competition_participants").update(payload).eq("id", participantId)
    if (error) throw error
    await refresh()
  }, [refresh, supabase])

  return {
    competitions,
    participants,
    isLoading,
    refresh,
    createCompetition,
    updateCompetition,
    deleteCompetition,
    addParticipants,
    removeParticipant,
    setPaymentStatus,
  }
}
