import { useEffect } from 'react'
import { api } from '../../api/client'
import type { UserPreferences } from '../../api/types'
import { useAuthStore } from '../../stores/authStore'
import { usePreferencesStore } from '../../stores/preferencesStore'

export function UserPreferencesBootstrap() {
  const token = useAuthStore((s) => s.token)
  const setPreferences = usePreferencesStore((s) => s.setPreferences)

  useEffect(() => {
    if (!token) return

    let cancelled = false
    api
      .get<UserPreferences>('/api/user/preferences')
      .then(({ data }) => {
        if (!cancelled) setPreferences(data)
      })
      .catch(() => {
        // Keep persisted local preferences when the API is unavailable.
      })

    return () => {
      cancelled = true
    }
  }, [token, setPreferences])

  return null
}
