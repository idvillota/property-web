import axios from 'axios'
import { clearAuthSession } from '../features/auth/applyAuthSession'
import { getApiBaseUrl } from '../lib/apiBaseUrl'
import { useAuthStore } from '../stores/authStore'

const baseURL = getApiBaseUrl()

export const api = axios.create({
  baseURL,
  headers: { 'Content-Type': 'application/json' },
})

let handlingUnauthorized = false

function isAuthEndpoint(url: string | undefined) {
  if (!url) return false
  return url.includes('/api/Auth/login') || url.includes('/api/Auth/register')
}

api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status
    const requestUrl = error.config?.url as string | undefined
    const hadToken = Boolean(useAuthStore.getState().token)

    if (
      status === 401 &&
      hadToken &&
      !isAuthEndpoint(requestUrl) &&
      !handlingUnauthorized
    ) {
      handlingUnauthorized = true
      clearAuthSession()

      const path = `${window.location.pathname}${window.location.search}`
      const params = new URLSearchParams()
      params.set('session', 'expired')
      const portal = path.startsWith('/portal')
      if (path && path !== '/login' && path !== '/register' && path !== '/portal/login') {
        params.set('returnUrl', path)
      }
      window.location.assign(portal ? `/portal/login?${params.toString()}` : `/login?${params.toString()}`)
    }

    return Promise.reject(error)
  },
)
