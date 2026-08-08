import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import {
  DEFAULT_BRAND_THEME,
  DEFAULT_COLOR_SCHEME,
  normalizeBrandTheme,
  normalizeColorScheme,
  type BrandThemeId,
  type ColorSchemePreference,
} from '../theme/brandThemes'

export type UserPreferencesState = {
  brandTheme: BrandThemeId
  colorScheme: ColorSchemePreference
}

type PreferencesStore = UserPreferencesState & {
  setPreferences: (prefs: UserPreferencesState) => void
  reset: () => void
}

const defaults: UserPreferencesState = {
  brandTheme: DEFAULT_BRAND_THEME,
  colorScheme: DEFAULT_COLOR_SCHEME,
}

export const usePreferencesStore = create<PreferencesStore>()(
  persist(
    (set) => ({
      ...defaults,
      setPreferences: (prefs) =>
        set({
          brandTheme: normalizeBrandTheme(prefs.brandTheme),
          colorScheme: normalizeColorScheme(prefs.colorScheme),
        }),
      reset: () => set(defaults),
    }),
    {
      name: 'property-preferences',
      partialize: (state) => ({
        brandTheme: state.brandTheme,
        colorScheme: state.colorScheme,
      }),
    },
  ),
)
