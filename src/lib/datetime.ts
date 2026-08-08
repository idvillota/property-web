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
