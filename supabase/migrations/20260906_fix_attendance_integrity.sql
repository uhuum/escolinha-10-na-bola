-- Applied to production on 2026-09-06.
-- Keep one attendance row per student/call and make parent deletion safe.
WITH ranked AS (
  SELECT id, ROW_NUMBER() OVER (
    PARTITION BY attendance_id, student_id
    ORDER BY created_at DESC NULLS LAST, id DESC
  ) AS rn
  FROM public.attendance_records
)
DELETE FROM public.attendance_records ar USING ranked r
WHERE ar.id = r.id AND r.rn > 1;

CREATE UNIQUE INDEX IF NOT EXISTS attendance_records_attendance_student_uidx
  ON public.attendance_records (attendance_id, student_id);

ALTER TABLE public.attendance_records
  DROP CONSTRAINT IF EXISTS attendance_records_attendance_id_fkey;
ALTER TABLE public.attendance_records
  ADD CONSTRAINT attendance_records_attendance_id_fkey
  FOREIGN KEY (attendance_id) REFERENCES public.attendance(id) ON DELETE CASCADE;

DROP POLICY IF EXISTS "Allow delete attendance records" ON public.attendance_records;
CREATE POLICY "Allow delete attendance records"
  ON public.attendance_records FOR DELETE TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "Allow update attendance records" ON public.attendance_records;
CREATE POLICY "Allow update attendance records"
  ON public.attendance_records FOR UPDATE TO anon, authenticated
  USING (true) WITH CHECK (true);
