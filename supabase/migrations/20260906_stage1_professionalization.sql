-- Applied to production on 2026-09-06.
-- Non-destructive Stage 1: performance/security hardening.
CREATE INDEX IF NOT EXISTS idx_payments_due_date ON public.payments (due_date);
CREATE INDEX IF NOT EXISTS idx_payments_period_status ON public.payments (year_number, month_number, status);
CREATE INDEX IF NOT EXISTS idx_attendance_trainer_id ON public.attendance (trainer_id);
CREATE INDEX IF NOT EXISTS idx_attendance_date_schedule ON public.attendance (date, class_schedule, day_of_week);
CREATE INDEX IF NOT EXISTS idx_attendance_records_attendance_id ON public.attendance_records (attendance_id);
CREATE INDEX IF NOT EXISTS idx_attendance_records_student_id ON public.attendance_records (student_id);
CREATE INDEX IF NOT EXISTS idx_receipts_payment_id ON public.receipts (payment_id);
CREATE INDEX IF NOT EXISTS idx_receipts_student_id ON public.receipts (student_id);

ALTER FUNCTION public.generate_student_payments(uuid, integer, boolean, timestamp with time zone) SET search_path = public, pg_temp;
ALTER FUNCTION public.generate_student_payments_safe(uuid, numeric, boolean) SET search_path = public, pg_temp;
ALTER FUNCTION public.sync_student_payments() SET search_path = public, pg_temp;
ALTER FUNCTION public.update_updated_at_column() SET search_path = public, pg_temp;
REVOKE EXECUTE ON FUNCTION public.rls_auto_enable() FROM PUBLIC, anon, authenticated;

DROP POLICY IF EXISTS "Enable delete for attendance" ON public.attendance;
DROP POLICY IF EXISTS "Enable insert for attendance" ON public.attendance;
DROP POLICY IF EXISTS "Enable read access to attendance" ON public.attendance;
DROP POLICY IF EXISTS "Enable update for attendance" ON public.attendance;
DROP POLICY IF EXISTS "Enable insert for attendance_records" ON public.attendance_records;
DROP POLICY IF EXISTS "Enable read access to attendance_records" ON public.attendance_records;
DROP POLICY IF EXISTS "Enable delete for payments" ON public.payments;
DROP POLICY IF EXISTS "Enable insert for payments" ON public.payments;
DROP POLICY IF EXISTS "Enable read access to payments" ON public.payments;
DROP POLICY IF EXISTS "Enable update for payments" ON public.payments;
DROP POLICY IF EXISTS "Enable delete for students" ON public.students;
DROP POLICY IF EXISTS "Enable insert for students" ON public.students;
DROP POLICY IF EXISTS "Enable read access to students" ON public.students;
DROP POLICY IF EXISTS "Enable update for students" ON public.students;

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('student-photos', 'student-photos', false, 524288, ARRAY['image/webp'])
ON CONFLICT (id) DO UPDATE SET public=false, file_size_limit=EXCLUDED.file_size_limit, allowed_mime_types=EXCLUDED.allowed_mime_types;
