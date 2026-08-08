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

export type Neighborhood = {
  id: string
  name: string
  city: string | null
  country: string
  isActive: boolean
}

export type HorizontalProperty = {
  id: string
  name: string
  tradeName: string | null
  nit: string | null
  addressLine: string
  city: string
  country: string
  neighborhoodId: string | null
  propertyUseType: string
  matriculaInmobiliaria: string | null
  regulationNotes: string | null
  coefficientBasisNotes: string | null
  isActive: boolean
}

export type Building = {
  id: string
  horizontalPropertyId: string
  name: string
  code: string | null
  sortOrder: number
  isActive: boolean
}

export type Floor = {
  id: string
  buildingId: string
  name: string
  number: number | null
  sortOrder: number
  isActive: boolean
}

export type Unit = {
  id: string
  horizontalPropertyId: string
  buildingId: string | null
  floorId: string | null
  code: string
  unitType: string
  privateBuiltAreaM2: number
  privateOpenAreaM2: number | null
  coefficient: number
  contributionModuleCode: string | null
  linkedUnitId: string | null
  isBillable: boolean
  isActive: boolean
}

export type Person = {
  id: string
  documentType: string
  documentNumber: string
  firstName: string
  lastName: string
  email: string | null
  phone: string | null
  isActive: boolean
}

export type UnitOccupancy = {
  id: string
  unitId: string
  personId: string
  role: string
  isPrimary: boolean
  receivesBilling: boolean
  startDate: string
  endDate: string | null
  isActive: boolean
  unitCode?: string
  personName?: string
}

export type CoefficientSummary = {
  totalCoefficient: number
  unitCount: number
  remainingToHundred: number
}
