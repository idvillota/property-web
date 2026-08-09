/**
 * API base URL for axios and static assets (/media/...).
 *
 * Local `npm run dev`: prefer same-origin + Vite proxy → http://127.0.0.1:5228
 * Never use leftover restaurant Azure URLs during development.
 */
export function getApiBaseUrl(): string {
  const configured = import.meta.env.VITE_API_URL?.trim() ?? ''
  const normalized = configured.replace(/\/$/, '')

  if (import.meta.env.DEV) {
    if (!normalized) return ''

    const isLocal =
      normalized.includes('localhost') ||
      normalized.includes('127.0.0.1') ||
      normalized.includes('0.0.0.0')

    if (isLocal) return normalized

    console.warn(
      `[Property] Ignoring non-local VITE_API_URL in development: ${normalized}. Using Vite proxy instead.`,
    )
    return ''
  }

  return normalized
}
