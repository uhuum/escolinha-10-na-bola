-- 2026-10-21: coach may correct their own attendance during the lesson day
-- and the next calendar day (America/Sao_Paulo). Admin policies unchanged.
-- On UPDATE, the existing trigger only permits changes to the status.
-- Only actual attendance sessions from today's/yesterday's dates qualify.
ALTER POLICY attendance_records_coach_update ON public.attendance_records
  USING (
    auth.uid() IS NOT NULL
    AND (auth.jwt()->'app_metadata'->>'role') = 'coach'
    AND EXISTS (
      SELECT 1 FROM public.attendance a
      WHERE a.id=attendance_records.attendance_id
        AND a.trainer_id::text=auth.jwt()->'app_metadata'->>'legacy_user_id'
        AND a.date IN (
          ((now() AT TIME ZONE 'America/Sao_Paulo')::date)::text,
          (((now() AT TIME ZONE 'America/Sao_Paulo')::date-1))::text
        )
    )
  )
  WITH CHECK (
    auth.uid() IS NOT NULL
    AND (auth.jwt()->'app_metadata'->>'role') = 'coach'
    AND EXISTS (
      SELECT 1 FROM public.attendance a
      WHERE a.id=attendance_records.attendance_id
        AND a.trainer_id::text=auth.jwt()->'app_metadata'->>'legacy_user_id'
        AND a.date IN (
          ((now() AT TIME ZONE 'America/Sao_Paulo')::date)::text,
          (((now() AT TIME ZONE 'America/Sao_Paulo')::date-1))::text
        )
    )
    AND public.staff_active_student_exists(student_id)
  );

ALTER POLICY attendance_records_coach_insert ON public.attendance_records
  WITH CHECK (
    auth.uid() IS NOT NULL
    AND (auth.jwt()->'app_metadata'->>'role') = 'coach'
    AND EXISTS (
      SELECT 1 FROM public.attendance a
      WHERE a.id=attendance_records.attendance_id
        AND a.trainer_id::text=auth.jwt()->'app_metadata'->>'legacy_user_id'
        AND a.date IN (
          ((now() AT TIME ZONE 'America/Sao_Paulo')::date)::text,
          (((now() AT TIME ZONE 'America/Sao_Paulo')::date-1))::text
        )
    )
    AND public.staff_active_student_exists(student_id)
  );

ALTER POLICY attendance_records_coach_delete ON public.attendance_records
  USING (
    auth.uid() IS NOT NULL
    AND (auth.jwt()->'app_metadata'->>'role') = 'coach'
    AND EXISTS (
      SELECT 1 FROM public.attendance a
      WHERE a.id=attendance_records.attendance_id
        AND a.trainer_id::text=auth.jwt()->'app_metadata'->>'legacy_user_id'
        AND a.date IN (
          ((now() AT TIME ZONE 'America/Sao_Paulo')::date)::text,
          (((now() AT TIME ZONE 'America/Sao_Paulo')::date-1))::text
        )
    )
  );

ALTER POLICY attendance_coach_delete ON public.attendance
  USING (
    auth.uid() IS NOT NULL
    AND (auth.jwt()->'app_metadata'->>'role') = 'coach'
    AND trainer_id::text=auth.jwt()->'app_metadata'->>'legacy_user_id'
    AND date IN (
      ((now() AT TIME ZONE 'America/Sao_Paulo')::date)::text,
      (((now() AT TIME ZONE 'America/Sao_Paulo')::date-1))::text
    )
  );
