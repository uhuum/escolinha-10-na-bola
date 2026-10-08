// Keep requesting pages until the server returns no rows. Advancing by the
// actual response size also supports projects with a lower API row limit.
export async function fetchAllRows<T>(
  fetchPage: (from: number, to: number) => PromiseLike<{ data: T[] | null; error: unknown }>,
): Promise<T[]> {
  const rows: T[] = []
  const pageSize = 500
  while (true) {
    const { data, error } = await fetchPage(rows.length, rows.length + pageSize - 1)
    if (error) throw error
    if (!data?.length) return rows
    rows.push(...data)
  }
}
