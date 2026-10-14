begin;

alter table public.students add column if not exists payment_due_day integer not null default 10 check (payment_due_day between 1 and 28);
alter table public.students add column if not exists enrollment_category text;

create table public.enrollment_requests (
  id uuid primary key default gen_random_uuid(),
  token_hash text not null unique check (token_hash ~ '^[a-f0-9]{64}$'),
  label text not null check (length(label) between 1 and 100),
  status text not null default 'invited' check (status in ('invited','pending','approved','cancelled')),
  payload jsonb,
  approval jsonb,
  privacy_version text,
  created_by uuid not null references auth.users(id),
  created_at timestamptz not null default now(),
  expires_at timestamptz not null,
  submitted_at timestamptz,
  approved_at timestamptz,
  approved_by uuid references auth.users(id),
  student_id uuid references public.students(id) on delete set null,
  check (status not in ('pending','approved') or (payload is not null and submitted_at is not null))
);
create index enrollment_requests_status_created on public.enrollment_requests(status, created_at desc, id);
alter table public.enrollment_requests enable row level security;
revoke all on public.enrollment_requests from public, anon, authenticated;
grant select, insert, update on public.enrollment_requests to authenticated;
grant all on public.enrollment_requests to service_role;
create policy enrollment_admin_select on public.enrollment_requests for select to authenticated
  using ((select auth.jwt()->'app_metadata'->>'role') = 'admin');
create policy enrollment_admin_insert on public.enrollment_requests for insert to authenticated
  with check ((select auth.jwt()->'app_metadata'->>'role') = 'admin' and created_by = (select auth.uid()) and status = 'invited' and payload is null);
create policy enrollment_admin_update on public.enrollment_requests for update to authenticated
  using ((select auth.jwt()->'app_metadata'->>'role') = 'admin')
  with check ((select auth.jwt()->'app_metadata'->>'role') = 'admin');

-- The caller's session and RLS remain active. All writes share one transaction.
create function public.approve_enrollment(p_request_id uuid, p_approval jsonb) returns uuid
language plpgsql security invoker set search_path = public, pg_temp as $$
declare
  r public.enrollment_requests%rowtype;
  student_uuid uuid;
  due_day integer;
  amount integer;
  configs jsonb;
  days text[];
  doc text;
  today date := (now() at time zone 'America/Sao_Paulo')::date;
  month_start date;
  due date;
  month_names text[] := array['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'];
begin
  if coalesce(auth.jwt()->'app_metadata'->>'role','') <> 'admin' or auth.uid() is null then raise exception 'FORBIDDEN'; end if;
  select * into r from public.enrollment_requests where id = p_request_id for update;
  if not found then raise exception 'NOT_PENDING'; end if;
  if r.status = 'approved' then
    if r.student_id is null then raise exception 'NOT_PENDING'; end if;
    return r.student_id;
  end if;
  if r.status <> 'pending' then raise exception 'NOT_PENDING'; end if;
  due_day := (p_approval->>'dueDay')::integer;
  amount := (p_approval->>'monthlyValue')::integer;
  configs := p_approval->'scheduleConfigs';
  if due_day is null or due_day not between 1 and 28 or amount is null or amount not between 0 and 10000
    or coalesce(p_approval->>'category','') !~ '^Sub-(08|09|10|11|12|13|14|15|16)$'
    or jsonb_typeof(configs) is distinct from 'array' then raise exception 'INVALID_APPROVAL'; end if;
  if jsonb_array_length(configs) not between 1 and 5 then raise exception 'INVALID_SCHEDULE'; end if;
  if exists (select 1 from jsonb_array_elements(configs) c where coalesce(c->>'day','') not in ('Segunda','Terça','Quarta','Quinta','Sexta') or coalesce(c->>'schedule','') not in ('18:00-19:30','19:30-21:00')) then raise exception 'INVALID_SCHEDULE'; end if;
  select array_agg(c->>'day') into days from jsonb_array_elements(configs) c;
  if (select count(distinct d) from unnest(days) d) <> cardinality(days) then raise exception 'INVALID_SCHEDULE'; end if;
  doc := regexp_replace(upper(r.payload->>'document'),'[^A-Z0-9]','','g');
  -- Serialize approvals of the same document, including separate invitation links.
  perform pg_advisory_xact_lock(hashtextextended(doc, 0));
  perform pg_advisory_xact_lock(hashtextextended(lower(trim(r.payload->>'name')) || (r.payload->>'birthDate'), 1));
  if exists (select 1 from public.students s
    where regexp_replace(upper(coalesce(s.rg,'')),'[^A-Z0-9]','','g') = doc
       or (lower(trim(s.name)) = lower(trim(r.payload->>'name')) and s.birth_date::text = r.payload->>'birthDate')) then raise exception 'DUPLICATE_STUDENT'; end if;
  insert into public.students(name,rg,birth_date,responsible,responsible_cpf,responsible_email,father_phone,mother_phone,monthly_value,is_active,is_scholarship,class_schedule,class_days,schedule_configs,registration_date,payment_due_day,enrollment_category)
    values(r.payload->>'name',r.payload->>'document',(r.payload->>'birthDate')::date,r.payload->>'responsible',r.payload->>'responsibleCpf',r.payload->>'email',r.payload->>'phone',r.payload->>'emergencyPhone',amount,true,amount=0,configs->0->>'schedule',days,configs,now(),due_day,p_approval->>'category')
    returning id into student_uuid;
  for month_start in select d::date from generate_series(date_trunc('month',today),make_date(extract(year from today)::integer+1,12,1),'1 month'::interval) d loop
    due := month_start + (due_day-1);
    insert into public.payments(student_id,month,status,value,due_date,month_number,year_number)
    values(student_uuid,month_names[extract(month from month_start)::integer] || '/' || extract(year from month_start)::integer,
      case when amount=0 then 'Bolsista' when due<today then 'Não Pagou' else 'Em Aberto' end,
      amount,due,extract(month from month_start)::integer,extract(year from month_start)::integer)
    on conflict(student_id,month) do update set due_date=excluded.due_date,status=excluded.status,value=excluded.value;
  end loop;
  update public.enrollment_requests set status='approved',approval=p_approval,approved_at=now(),approved_by=auth.uid(),student_id=student_uuid where id=r.id;
  return student_uuid;
end $$;
revoke all on function public.approve_enrollment(uuid,jsonb) from public, anon;
grant execute on function public.approve_enrollment(uuid,jsonb) to authenticated;
commit;
