-- ETAPA 2: Supabase Auth + RLS autenticado
-- IMPORTANTE: aplicar somente depois que a versão com Supabase Auth estiver publicada.

begin;

-- Remove políticas antigas/permissivas das tabelas usadas pelo SIGA.
do $$
declare
  p record;
begin
  for p in
    select schemaname, tablename, policyname
    from pg_policies
    where schemaname = 'public'
      and tablename in ('students','payments','attendance','attendance_records','receipts','users')
  loop
    execute format('drop policy if exists %I on %I.%I', p.policyname, p.schemaname, p.tablename);
  end loop;
end $$;

alter table public.students enable row level security;
alter table public.payments enable row level security;
alter table public.attendance enable row level security;
alter table public.attendance_records enable row level security;
alter table public.receipts enable row level security;
alter table public.users enable row level security;

-- O navegador não deve mais consultar dados do sistema sem uma sessão Auth real.
revoke all on table public.students from anon;
revoke all on table public.payments from anon;
revoke all on table public.attendance from anon;
revoke all on table public.attendance_records from anon;
revoke all on table public.receipts from anon;
revoke all on table public.users from anon;

-- Usuários autenticados podem enxergar alunos; treinador também precisa atualizar
-- cadastro operacional/horário pelo carômetro.
grant select, insert, update, delete on table public.students to authenticated;
create policy "siga_students_select_authenticated"
on public.students for select to authenticated using (true);
create policy "siga_students_update_authenticated"
on public.students for update to authenticated using (true) with check (true);
create policy "siga_students_insert_admin"
on public.students for insert to authenticated
with check ((select auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');
create policy "siga_students_delete_admin"
on public.students for delete to authenticated
using ((select auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

-- Financeiro: somente administrador.
grant select, insert, update, delete on table public.payments to authenticated;
create policy "siga_payments_admin"
on public.payments for all to authenticated
using ((select auth.jwt() -> 'app_metadata' ->> 'role') = 'admin')
with check ((select auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

-- Frequência: administrador e treinador.
grant select, insert, update, delete on table public.attendance to authenticated;
create policy "siga_attendance_authenticated"
on public.attendance for all to authenticated using (true) with check (true);

grant select, insert, update, delete on table public.attendance_records to authenticated;
create policy "siga_attendance_records_authenticated"
on public.attendance_records for all to authenticated using (true) with check (true);

-- Comprovantes: somente administrador.
grant select, insert, update, delete on table public.receipts to authenticated;
create policy "siga_receipts_admin"
on public.receipts for all to authenticated
using ((select auth.jwt() -> 'app_metadata' ->> 'role') = 'admin')
with check ((select auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

-- A antiga tabela public.users fica apenas como ponte de migração no servidor.
-- O navegador não recebe acesso direto a hashes ou cadastros de login.
revoke all on table public.users from authenticated;

commit;
