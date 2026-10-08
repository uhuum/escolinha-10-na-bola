import assert from "node:assert/strict"
import { test } from "node:test"
import { fetchAllRows } from "../lib/supabase/paginate.ts"

function pageSource(rows, serverLimit = 1000) {
  return async (from, to) => ({
    data: rows.slice(from, Math.min(to + 1, from + serverLimit)),
    error: null,
  })
}

test("October records remain visible after more than 1000 historical rows", async () => {
  const records = Array.from({ length: 1250 }, (_, id) => ({
    attendance_id: id < 1000 ? "september" : "october",
    student_id: id,
    status: id % 2 ? "Presente" : "Ausente",
  }))
  const result = await fetchAllRows(pageSource(records))
  assert.deepEqual(result, records)
  const october = result.filter((row) => row.attendance_id === "october")
  assert.equal(october.length, 250)
  assert.equal(october.filter((row) => row.status === "Presente").length, 125)
})

test("handles a lower server cap and exact page multiples without duplicates", async () => {
  const rows = Array.from({ length: 1500 }, (_, id) => ({ id }))
  for (const cap of [100, 500, 1000]) {
    assert.deepEqual(await fetchAllRows(pageSource(rows, cap)), rows)
  }
})

test("empty history terminates", async () => {
  assert.deepEqual(await fetchAllRows(pageSource([])), [])
})

test("a later page error rejects instead of returning incomplete history", async () => {
  const failure = new Error("Connection failed")
  await assert.rejects(fetchAllRows(async (from) => from === 0
    ? { data: [{ id: 1 }], error: null }
    : { data: null, error: failure }), failure)
})
