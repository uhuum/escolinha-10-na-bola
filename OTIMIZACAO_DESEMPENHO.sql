-- SIGA: indexes for the most frequent filters/joins.
-- Safe to run more than once.
CREATE INDEX IF NOT EXISTS idx_payments_student_id ON public.payments (student_id);
CREATE INDEX IF NOT EXISTS idx_payments_period ON public.payments (year_number, month_number);
CREATE INDEX IF NOT EXISTS idx_payments_student_period ON public.payments (student_id, year_number, month_number);
CREATE INDEX IF NOT EXISTS idx_attendance_date ON public.attendance (date DESC);
CREATE INDEX IF NOT EXISTS idx_attendance_records_attendance_id ON public.attendance_records (attendance_id);
CREATE INDEX IF NOT EXISTS idx_attendance_records_student_id ON public.attendance_records (student_id);
CREATE INDEX IF NOT EXISTS idx_students_active ON public.students (is_active) WHERE archived_at IS NULL;
