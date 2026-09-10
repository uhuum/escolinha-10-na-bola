create table if not exists public.competitions (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(trim(name)) > 0),
  type text not null check (type in ('Campeonato', 'Amistoso')),
  event_date date not null,
  fee_value integer not null default 0 check (fee_value >= 0),
  category text,
  opponent text,
  location text,
  notes text,
  status text not null default 'Aberto' check (status in ('Aberto', 'Encerrado')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.competition_participants (
  id uuid primary key default gen_random_uuid(),
  competition_id uuid not null references public.competitions(id) on delete cascade,
  student_id uuid not null references public.students(id) on delete cascade,
  payment_status text not null default 'Não Pago' check (payment_status in ('Não Pago', 'Cobrado', 'Pago')),
  payment_type text check (payment_type is null or payment_type in ('pix', 'dinheiro')),
  paid_at timestamptz,
  charged_at timestamptz,
  receipt text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint competition_participants_unique unique (competition_id, student_id)
);

create index if not exists competitions_event_date_idx on public.competitions(event_date desc);
create index if not exists competitions_status_idx on public.competitions(status);
create index if not exists competition_participants_competition_idx on public.competition_participants(competition_id);
create index if not exists competition_participants_student_idx on public.competition_participants(student_id);
create index if not exists competition_participants_payment_status_idx on public.competition_participants(competition_id, payment_status);

alter table public.competitions enable row level security;
alter table public.competition_participants enable row level security;
revoke all on table public.competitions from anon;
revoke all on table public.competition_participants from anon;
revoke all on table public.competitions from authenticated;
revoke all on table public.competition_participants from authenticated;
grant select, insert, update, delete on table public.competitions to authenticated;
grant select, insert, update, delete on table public.competition_participants to authenticated;

create policy "competitions_admin_select" on public.competitions for select to authenticated using ((select auth.uid()) is not null and coalesce((select auth.jwt()) -> 'app_metadata' ->> 'role', '') = 'admin');
create policy "competitions_admin_insert" on public.competitions for insert to authenticated with check ((select auth.uid()) is not null and coalesce((select auth.jwt()) -> 'app_metadata' ->> 'role', '') = 'admin');
create policy "competitions_admin_update" on public.competitions for update to authenticated using ((select auth.uid()) is not null and coalesce((select auth.jwt()) -> 'app_metadata' ->> 'role', '') = 'admin') with check ((select auth.uid()) is not null and coalesce((select auth.jwt()) -> 'app_metadata' ->> 'role', '') = 'admin');
create policy "competitions_admin_delete" on public.competitions for delete to authenticated using ((select auth.uid()) is not null and coalesce((select auth.jwt()) -> 'app_metadata' ->> 'role', '') = 'admin');
create policy "competition_participants_admin_select" on public.competition_participants for select to authenticated using ((select auth.uid()) is not null and coalesce((select auth.jwt()) -> 'app_metadata' ->> 'role', '') = 'admin');
create policy "competition_participants_admin_insert" on public.competition_participants for insert to authenticated with check ((select auth.uid()) is not null and coalesce((select auth.jwt()) -> 'app_metadata' ->> 'role', '') = 'admin');
create policy "competition_participants_admin_update" on public.competition_participants for update to authenticated using ((select auth.uid()) is not null and coalesce((select auth.jwt()) -> 'app_metadata' ->> 'role', '') = 'admin') with check ((select auth.uid()) is not null and coalesce((select auth.jwt()) -> 'app_metadata' ->> 'role', '') = 'admin');
create policy "competition_participants_admin_delete" on public.competition_participants for delete to authenticated using ((select auth.uid()) is not null and coalesce((select auth.jwt()) -> 'app_metadata' ->> 'role', '') = 'admin');
