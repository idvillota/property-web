export type AuthResponse = {
  accessToken: string
  userId: string
  tenantId: string
  tenantSlug: string
  email: string
  roles: string[]
  permissions: string[]
  isPlatformAdmin?: boolean
  brandTheme: BrandThemeId
  colorScheme: ColorSchemePreference
}

export type LoginTenantOption = {
  slug: string
  name: string
}

export type MultipleTenantsLoginError = {
  code: 'multiple_tenants'
  message: string
  tenants: LoginTenantOption[]
}

export type UserPreferences = {
  brandTheme: BrandThemeId
  colorScheme: ColorSchemePreference
}

export type BrandThemeId = 'warm' | 'refined' | 'operations'
export type ColorSchemePreference = 'light' | 'dark' | 'auto'

export type PermissionFeature = {
  id: string
  code: string
  name: string
  module: string
  sortOrder: number
}

export type PermissionRole = {
  id: string
  name: string
  featureCodes: string[]
}

export type RolePermissionMatrix = {
  features: PermissionFeature[]
  roles: PermissionRole[]
}

export type Employee = {
  id: string
  tenantUserId: string | null
  fullName: string
  jobTitle: string | null
  hiredOn: string | null
  isActive: boolean
}

export type InvitedTenantUser = {
  userId: string
  tenantUserId: string
  email: string
  roles: string[]
}

export type TenantSettings = {
  tradeName: string
  legalName: string
  taxRegime: string
  taxId: string
  legalRepresentative: string | null
  addressLine: string
  city: string
  country: string
  postalCode: string | null
  phone: string | null
}

export type PlatformTenantsStatus = {
  status: string
}

export type DashboardPanel = {
  id: string
  widgetType: string
  x: number
  y: number
  w: number
  h: number
  config?: Record<string, unknown>
}

export type DashboardLayout = {
  version: number
  panels: DashboardPanel[]
}

export type DashboardWidgetDefinition = {
  widgetType: string
  name: string
  description: string
  category: string
  requiredPermission: string
  defaultWidth: number
  defaultHeight: number
  minWidth: number
  minHeight: number
}
