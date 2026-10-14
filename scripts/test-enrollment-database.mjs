// Run with PGLITE_MODULE pointing to the installed @electric-sql/pglite entry.
import assert from 'node:assert/strict'
import fs from 'node:fs/promises'
const { PGlite } = await import(process.env.PGLITE_MODULE || '@electric-sql/pglite')
const db = new PGlite()
const admin = '00000000-0000-4000-8000-000000000001'
const coach = '00000000-0000-4000-8000-000000000002'
await db.exec(`
create role anon; create role authenticated; create role service_role bypassrls;
create schema auth; grant usage on schema auth to authenticated,anon;
create table auth.users(id uuid primary key);
insert into auth.users values ('${admin}'),('${coach}');
create function auth.jwt() returns jsonb language sql as $$ select coalesce(nullif(current_setting('request.jwt.claims',true),''),'{}')::jsonb $$;
create function auth.uid() returns uuid language sql as $$ select (auth.jwt()->>'sub')::uuid $$;
create table public.students(id uuid primary key default gen_random_uuid(), name text not null, rg text, birth_date date, responsible text, responsible_cpf text, responsible_email text, father_phone text, mother_phone text, monthly_value integer, is_active boolean, is_scholarship boolean, class_schedule text, class_days text[], schedule_configs jsonb, registration_date timestamptz);
create table public.payments(id uuid primary key default gen_random_uuid(),student_id uuid references students(id),month text,status text,value integer,due_date date,month_number integer,year_number integer,unique(student_id,month));
alter table students enable row level security; alter table payments enable row level security;
grant select,insert,update on students,payments to authenticated;
create policy students_admin on students for all to authenticated using ((auth.jwt()->'app_metadata'->>'role')='admin') with check ((auth.jwt()->'app_metadata'->>'role')='admin');
create policy payments_admin on payments for all to authenticated using ((auth.jwt()->'app_metadata'->>'role')='admin') with check ((auth.jwt()->'app_metadata'->>'role')='admin');
`)
await db.exec(await fs.readFile(new URL('../supabase/migrations/20261014011127_enrollment_links.sql', import.meta.url), 'utf8'))
const payload = { name: 'Aluno de Teste', document: '12345678X', birthDate: '2016-05-02', responsible: 'Responsável de Teste', responsibleCpf: '52998224725', email: 'example@example.com', phone: '11999990000', emergencyPhone: '11988880000' }
const approval = { category: 'Sub-10', dueDay: 15, monthlyValue: 120, scheduleConfigs: [{ day: 'Terça', schedule: '18:00-19:30' }, { day: 'Quinta', schedule: '19:30-21:00' }] }
async function role(name, id, appRole) {
  await db.exec('reset role')
  await db.query("select set_config('request.jwt.claims',$1,false)", [JSON.stringify({ sub: id, app_metadata: { role: appRole } })])
  await db.exec(`set role ${name}`)
}
let counter = 0
async function pending(p = payload) {
  await db.exec('reset role')
  const result = await db.query("insert into enrollment_requests(token_hash,label,created_by,expires_at,status,payload,submitted_at) values ($1,'Teste',$2,now()+interval '14 days','pending',$3,now()) returning id", [String(++counter).padStart(64, '0'), admin, JSON.stringify(p)])
  return result.rows[0].id
}
const id = await pending()
await role('anon', null, null)
await assert.rejects(db.query('select * from enrollment_requests'), /permission denied/)
await assert.rejects(db.query("insert into enrollment_requests(token_hash,label,created_by,expires_at) values ('x','x',$1,now())", [admin]), /permission denied/)
await role('authenticated', coach, 'coach')
assert.equal((await db.query('select * from enrollment_requests')).rows.length, 0)
await assert.rejects(db.query('select approve_enrollment($1,$2)', [id, JSON.stringify(approval)]), /FORBIDDEN/)
await role('authenticated', admin, 'admin')
const result = await db.query('select approve_enrollment($1,$2) as id', [id, JSON.stringify(approval)])
const studentId = result.rows[0].id
assert.equal((await db.query('select * from students')).rows.length, 1)
const payments = (await db.query('select * from payments')).rows
assert.ok(payments.length >= 13)
assert.ok(payments.every((p) => new Date(p.due_date).getUTCDate() === 15 && p.value === 120))
assert.equal((await db.query('select approve_enrollment($1,$2) as id', [id, JSON.stringify(approval)])).rows[0].id, studentId)
assert.equal((await db.query('select * from students')).rows.length, 1)
const duplicateId = await pending()
await role('authenticated', admin, 'admin')
await assert.rejects(db.query('select approve_enrollment($1,$2)', [duplicateId, JSON.stringify(approval)]), /DUPLICATE_STUDENT/)
const failureId = await pending({ ...payload, name: 'Outro Aluno', document: '87654321X' })
await db.exec('alter table payments add constraint simulate_failure check (value<>777)')
await role('authenticated', admin, 'admin')
await assert.rejects(db.query('select approve_enrollment($1,$2)', [failureId, JSON.stringify({ ...approval, monthlyValue: 777 })]), /simulate_failure/)
assert.equal((await db.query('select * from students')).rows.length, 1)
assert.equal((await db.query('select status from enrollment_requests where id=$1', [failureId])).rows[0].status, 'pending')
await db.exec('reset role')
assert.equal((await db.query("select prosecdef from pg_proc where proname='approve_enrollment'")).rows[0].prosecdef, false)
console.log('PASS: migration, anonymous/coach restrictions, approval, payment dates, idempotency, duplicate detection and atomic rollback')
await db.close()
