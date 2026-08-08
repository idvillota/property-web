export type BrandThemeId = 'warm' | 'refined' | 'operations'
export type ColorSchemePreference = 'light' | 'dark' | 'auto'

export const DEFAULT_BRAND_THEME: BrandThemeId = 'operations'
export const DEFAULT_COLOR_SCHEME: ColorSchemePreference = 'auto'

export type BrandThemeDefinition = {
  id: BrandThemeId
  name: string
  description: string
  swatch: string
  primaryColor: string
}

export const BRAND_THEMES: BrandThemeDefinition[] = [
  {
    id: 'operations',
    name: 'Operaciones',
    description: 'Neutro y funcional, ideal para el día a día.',
    swatch: '#3b82f6',
    primaryColor: 'blue',
  },
  {
    id: 'warm',
    name: 'Sala Cálida',
    description: 'Terracota y tonos cálidos para un ambiente acogedor.',
    swatch: '#ea580c',
    primaryColor: 'orange',
  },
  {
    id: 'refined',
    name: 'Sala Refinada',
    description: 'Carbón y oro para una experiencia más elegante.',
    swatch: '#ca8a04',
    primaryColor: 'yellow',
  },
]

export const COLOR_SCHEME_OPTIONS: { value: ColorSchemePreference; label: string }[] = [
  { value: 'light', label: 'Claro' },
  { value: 'dark', label: 'Oscuro' },
  { value: 'auto', label: 'Sistema' },
]

export function isBrandThemeId(value: string): value is BrandThemeId {
  return BRAND_THEMES.some((theme) => theme.id === value)
}

export function isColorSchemePreference(value: string): value is ColorSchemePreference {
  return COLOR_SCHEME_OPTIONS.some((option) => option.value === value)
}

export function normalizeBrandTheme(value: string | undefined | null): BrandThemeId {
  return value && isBrandThemeId(value) ? value : DEFAULT_BRAND_THEME
}

export function normalizeColorScheme(value: string | undefined | null): ColorSchemePreference {
  return value && isColorSchemePreference(value) ? value : DEFAULT_COLOR_SCHEME
}

export function getBrandThemeDefinition(id: BrandThemeId): BrandThemeDefinition {
  return BRAND_THEMES.find((theme) => theme.id === id) ?? BRAND_THEMES[0]
}
