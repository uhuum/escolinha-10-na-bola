import assert from 'node:assert/strict'
import { test } from 'node:test'
import { enrollmentSchema, approvalSchema } from '../lib/enrollment/validation.ts'
import { isPublicPage, canRoleAccessPath } from '../lib/auth/route-policy.ts'

const fixture = { name: 'Aluno de Teste', documentType: 'RG', document: '12345678X', birthDate: '2016-05-02', responsible: 'Responsável de Teste', responsibleCpf: '52998224725', email: 'example@example.com', phone: '(11) 99999-0000', emergencyName: 'Contato de Teste', emergencyRelationship: 'Avó', emergencyPhone: '11988880000', dueDay: 10, healthNotes: '', confirmed: true }
test('validates and normalizes enrollment without a signature', () => {
  const parsed = enrollmentSchema.parse(fixture)
  assert.equal(parsed.phone, '11999990000')
  assert.equal(parsed.dueDay, 10)
})
test('rejects invalid identities, future/impossible dates, confirmation and oversized input', () => {
  for (const patch of [{ responsibleCpf: '11111111111' }, { birthDate: '2016-02-30' }, { birthDate: '2099-01-01' }, { confirmed: false }, { healthNotes: 'x'.repeat(2001) }, { dueDay: 31 }, { phone: '1234' }, { email: 'invalid' }, { documentType: 'CPF', document: '11111111111' }]) assert.equal(enrollmentSchema.safeParse({ ...fixture, ...patch }).success, false, JSON.stringify(patch))
})
test('approval requires category and unique days and bounds payment values', () => {
  const approval = { category: 'Sub-10', monthlyValue: 120, dueDay: 15, scheduleConfigs: [{ day: 'Terça', schedule: '18:00-19:30' }] }
  assert.equal(approvalSchema.safeParse(approval).success, true)
  for (const patch of [{ category: '' }, { monthlyValue: -1 }, { monthlyValue: 12.5 }, { dueDay: 0 }, { scheduleConfigs: [] }, { scheduleConfigs: [...approval.scheduleConfigs, ...approval.scheduleConfigs] }]) assert.equal(approvalSchema.safeParse({ ...approval, ...patch }).success, false)
})
test('public form does not make the admin inbox public or available to coaches', () => {
  assert.equal(isPublicPage('/matricula?convite=abc'), true)
  assert.equal(isPublicPage('/matriculas'), false)
  assert.equal(isPublicPage('/matricula/anything'), false)
  assert.equal(canRoleAccessPath('coach', '/matriculas'), false)
  assert.equal(canRoleAccessPath('admin', '/matriculas'), true)
})
