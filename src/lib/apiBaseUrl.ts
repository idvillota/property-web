/**
 * API base URL for axios and static assets (/media/...).
 *
 * Local (empty VITE_API_URL): use same origin; Vite proxies /api and /media to the API.
 * Azure "dev" build: set VITE_API_URL (see .env.dev.example, npm run build:dev).
 * Production without VITE_API_URL: same origin via reverse proxy.
 */
export function getApiBaseUrl(): string {
  const configured = import.meta.env.VITE_API_URL?.trim()
  if (configured) return configured.replace(/\/$/, '')
  return ''
}
