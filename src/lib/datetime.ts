/** Local datetime-local input value → ISO UTC string for API */
export function localInputToUtcIso(localValue: string): string {
  if (!localValue) return new Date().toISOString()
  return new Date(localValue).toISOString()
}

/** API UTC ISO → value for datetime-local input (local timezone) */
export function utcIsoToLocalInput(iso: string): string {
  const d = new Date(iso)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

/** Start of today as datetime-local value (`YYYY-MM-DDT00:00`). */
export function localTodayStartInput(): string {
  const d = new Date()
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T00:00`
}

/** True when the local datetime-local value falls on a calendar day before today. */
export function isLocalInputBeforeToday(localValue: string): boolean {
  if (!localValue) return false
  const datePart = localValue.slice(0, 10)
  if (!/^\d{4}-\d{2}-\d{2}$/.test(datePart)) return false
  const today = localTodayStartInput().slice(0, 10)
  return datePart < today
}
