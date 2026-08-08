export function getApiErrorMessage(err: unknown, fallback = 'Algo salió mal'): string {
  if (typeof err === 'object' && err !== null && 'response' in err) {
    const data = (err as { response?: { data?: { message?: string; title?: string } } }).response?.data
    if (data?.message) return String(data.message)
    if (data?.title) return String(data.title)
  }
  if (err instanceof Error && err.message) return err.message
  return fallback
}
