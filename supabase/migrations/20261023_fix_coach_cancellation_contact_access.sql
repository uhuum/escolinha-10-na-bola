-- SIGA: acesso restrito do treinador ao cancelamento e aos contatos de alunos em acompanhamento.
-- Evita consultar public.users diretamente de dentro de uma politica executada pelo treinador.
CREATE OR REPLACE FUNCTION public.coach_matches_trainer_id(p_trainer_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO ''
AS $$
  SELECT auth.uid() IS NOT NULL
    AND (auth.jwt()->'app_metadata'->>'role') = 'coach'
    AND EXISTS (
      SELECT 1
      FROM public.users AS u
      JOIN auth.users AS a ON a.id = auth.uid()
      WHERE u.id = p_trainer_id
        AND u.role = 'coach'
        AND lower(u.username::text) = split_part(lower(a.email), '@', 1)
    );
$$;
REVOKE ALL ON FUNCTION public.coach_matches_trainer_id(uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.coach_matches_trainer_id(uuid) FROM anon;
GRANT EXECUTE ON FUNCTION public.coach_matches_trainer_id(uuid) TO authenticated;

DROP POLICY IF EXISTS training_cancellations_coach_insert ON public.training_cancellations;
CREATE POLICY training_cancellations_coach_insert
ON public.training_cancellations FOR INSERT TO authenticated
WITH CHECK (
  public.coach_matches_trainer_id(trainer_id)
  AND date ~ '^[0-9]{4}-[0-9]{2}-[0-9]{2}$'
  AND date::date >= DATE '2025-12-01'
  AND day_of_week = CASE EXTRACT(ISODOW FROM date::date)
    WHEN 1 THEN 'Segunda'
    WHEN 2 THEN 'Terça'
    WHEN 3 THEN 'Quarta'
    WHEN 4 THEN 'Quinta'
    WHEN 5 THEN 'Sexta'
    ELSE ''
  END
);

-- Esta funcao so retorna telefones para alunos com tres semanas
-- consecutivas de chamadas registradas como ausencia, em aulas
-- realizadas pelo proprio treinador autenticado.
CREATE OR REPLACE FUNCTION public.coach_followup_contacts()
RETURNS TABLE(student_id uuid, father_phone text, mother_phone text)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO ''
AS $$
  WITH actor AS (
    SELECT u.id AS trainer_id
    FROM public.users AS u
    JOIN auth.users AS a ON a.id = auth.uid()
    WHERE auth.uid() IS NOT NULL
      AND (auth.jwt()->'app_metadata'->>'role') = 'coach'
      AND u.role = 'coach'
      AND lower(u.username::text) = split_part(lower(a.email), '@', 1)
  ),
  weekly AS (
    SELECT ar.student_id,
      date_trunc('week', a.date::date)::date AS week_start,
      bool_and(ar.status = 'Ausente') AS all_absent
    FROM public.attendance a
    JOIN public.attendance_records ar ON ar.attendance_id = a.id
    JOIN actor ON actor.trainer_id = a.trainer_id
    WHERE a.date ~ '^[0-9]{4}-[0-9]{2}-[0-9]{2}$'
      AND a.date::date <= (now() AT TIME ZONE 'America/Sao_Paulo')::date
    GROUP BY ar.student_id, date_trunc('week', a.date::date)::date
  ),
  ranked AS (
    SELECT weekly.*,
      row_number() OVER (PARTITION BY student_id ORDER BY week_start DESC) AS rn
    FROM weekly
  ),
  flagged AS (
    SELECT student_id
    FROM ranked
    WHERE rn <= 3
    GROUP BY student_id
    HAVING count(*) = 3
      AND bool_and(all_absent)
      AND max(week_start) - min(week_start) = 14
  )
  SELECT s.id, s.father_phone, s.mother_phone
  FROM public.students s
  JOIN flagged ON flagged.student_id = s.id
  WHERE s.is_active IS TRUE AND s.archived_at IS NULL;
$$;
REVOKE ALL ON FUNCTION public.coach_followup_contacts() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.coach_followup_contacts() FROM anon;
GRANT EXECUTE ON FUNCTION public.coach_followup_contacts() TO authenticated;
