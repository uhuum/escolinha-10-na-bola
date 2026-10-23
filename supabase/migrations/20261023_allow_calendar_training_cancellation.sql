-- SIGA: permitir ao treinador registrar cancelamentos a partir de
-- qualquer data selecionada no calendario, inclusive futura.
-- Mantem verificacao de papel, identidade, dia util e protecao
-- contra treinos com chamada e cancelamentos duplicados ja existentes.
DROP POLICY IF EXISTS training_cancellations_coach_insert ON public.training_cancellations;

CREATE POLICY training_cancellations_coach_insert
ON public.training_cancellations FOR INSERT TO authenticated
WITH CHECK (
  (auth.jwt() -> 'app_metadata' ->> 'role') = 'coach'
  AND date ~ '^[0-9]{4}-[0-9]{2}-[0-9]{2}
  AND date::date >= DATE '2025-12-01'
  AND trainer_id = (
    SELECT u.id
    FROM public.users AS u
    WHERE lower(u.username::text) = split_part(lower(auth.jwt() ->> 'email'), '@', 1)
      AND u.role = 'coach'
    LIMIT 1
  )
  AND day_of_week = CASE extract(isodow FROM date::date)
    WHEN 1 THEN 'Segunda'
    WHEN 2 THEN 'Terça'
    WHEN 3 THEN 'Quarta'
    WHEN 4 THEN 'Quinta'
    WHEN 5 THEN 'Sexta'
    ELSE ''
  END
);
  AND date::date >= DATE '2025-12-01'
  AND trainer_id = (
    SELECT u.id
    FROM public.users AS u
    WHERE lower(u.username::text) = split_part(lower(auth.jwt() ->> 'email'), '@', 1)
      AND u.role = 'coach'
    LIMIT 1
  )
  AND day_of_week = CASE extract(isodow FROM date::date)
    WHEN 1 THEN 'Segunda'
    WHEN 2 THEN 'Terça'
    WHEN 3 THEN 'Quarta'
    WHEN 4 THEN 'Quinta'
    WHEN 5 THEN 'Sexta'
    ELSE ''
  END
);