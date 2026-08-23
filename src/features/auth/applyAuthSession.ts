import type { AuthResponse } from '../../api/types'
import { useAuthStore } from '../../stores/authStore'
import { usePreferencesStore } from '../../stores/preferencesStore'
import { normalizeBrandTheme, normalizeColorScheme } from '../../theme/brandThemes'
import { DEFAULT_TENANT_MODULES } from '../settings/lib/tenantModuleFlags'

export function applyAuthSession(data: AuthResponse) {
  useAuthStore.getState().setAuth({
    token: data.accessToken,
    tenantSlug: data.tenantSlug,
    email: data.email,
    roles: data.roles ?? [],
    permissions: data.permissions ?? [],
    isPlatformAdmin: Boolean(data.isPlatformAdmin),
    modules: data.modules ?? { ...DEFAULT_TENANT_MODULES },
  })

  usePreferencesStore.getState().setPreferences({
    brandTheme: normalizeBrandTheme(data.brandTheme),
    colorScheme: normalizeColorScheme(data.colorScheme),
  })
}

export function clearAuthSession() {
  useAuthStore.getState().clear()
  usePreferencesStore.getState().reset()
}
