export function formatBirthDate(value: string | null | undefined) {
  if (!value) return "Não informado"
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(value)
  return match ? `${match[3]}/${match[2]}/${match[1]}` : value
}
