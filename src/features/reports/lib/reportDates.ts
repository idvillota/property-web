function pad(n: number) {
  return String(n).padStart(2, '0')
}

/** Local calendar date as yyyy-MM-dd (for DateOnly query params). */
export function toIsoDate(date: Date = new Date()): string {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
}

export function todayIsoDate() {
  return toIsoDate(new Date())
}

export function firstOfMonthIsoDate() {
  const d = new Date()
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-01`
}

export function daysAgoIsoDate(days: number) {
  const d = new Date()
  d.setDate(d.getDate() - days)
  return toIsoDate(d)
}

export function formatShortDate(value: string | null | undefined) {
  if (!value) return '—'
  const d = new Date(value.includes('T') ? value : `${value}T00:00:00`)
  if (Number.isNaN(d.getTime())) return value
  return d.toLocaleDateString()
}

export function formatDateTime(value: string | null | undefined) {
  if (!value) return '—'
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return value
  return d.toLocaleString()
}
