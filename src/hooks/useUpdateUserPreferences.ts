import { useMutation } from '@tanstack/react-query'
import { api } from '../api/client'
import { getApiErrorMessage } from '../api/errors'
import type { UserPreferences } from '../api/types'
import { usePreferencesStore } from '../stores/preferencesStore'
import type { BrandThemeId, ColorSchemePreference } from '../theme/brandThemes'

export function useUpdateUserPreferences() {
  const setPreferences = usePreferencesStore((s) => s.setPreferences)

  return useMutation({
    mutationFn: async (next: Partial<UserPreferences>) => {
      const current = usePreferencesStore.getState()
      const { data } = await api.put<UserPreferences>('/api/user/preferences', {
        brandTheme: (next.brandTheme ?? current.brandTheme) as BrandThemeId,
        colorScheme: (next.colorScheme ?? current.colorScheme) as ColorSchemePreference,
      })
      return data
    },
    onSuccess: (data) => setPreferences(data),
    onError: (error) => {
      throw new Error(getApiErrorMessage(error, 'No se pudieron guardar las preferencias'))
    },
  })
}
