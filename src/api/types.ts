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

export type FeeSettings = {
  horizontalPropertyId: string
  monthlyBudgetAmount: number
  dueDayOfMonth: number
  lateInterestMonthlyPercent: number
  notes: string | null
}

export type BillingPeriod = {
  id: string
  horizontalPropertyId: string
  year: number
  month: number
  periodKey: string
  status: string | number
  notes: string | null
}

export type FeeCharge = {
  id: string
  horizontalPropertyId: string
  billingPeriodId: string
  unitId: string
  chargeType: string | number
  description: string
  coefficientSnapshot: number
  amount: number
  amountPaid: number
  dueDate: string
  status: string | number
  isActive: boolean
  unitCode?: string
  periodKey?: string
}

export type ArrearsSummary = {
  totalPending: number
  totalPartial: number
  totalOverdue: number
  unitCountInArrears: number
}

export type GenerateChargesResult = {
  createdCount: number
  skippedCount: number
  totalAmount: number
}

export type PaymentAllocation = {
  id?: string
  feeChargeId: string
  amount: number
  feeChargeDescription?: string
}

export type Payment = {
  id: string
  horizontalPropertyId: string
  unitId: string
  personId: string | null
  amount: number
  paidAt: string
  method: string | number
  reference: string | null
  notes: string | null
  isActive: boolean
  unitCode?: string
  allocations?: PaymentAllocation[]
}

export type CommonArea = {
  id: string
  horizontalPropertyId: string
  name: string
  areaType: string | number
  capacity: number
  requiresDeposit: boolean
  depositAmount: number | null
  rulesNotes: string | null
  minDurationMinutes: number | null
  maxDurationMinutes: number | null
  isActive: boolean
}

export type Reservation = {
  id: string
  horizontalPropertyId: string
  commonAreaId: string
  unitId: string
  personId: string | null
  startsAtUtc: string
  endsAtUtc: string
  status: string | number
  attendeesCount: number
  notes: string | null
  depositPaid: boolean
  isActive: boolean
  commonAreaName?: string
  unitCode?: string
  personName?: string
}

export type ReceptionItem = {
  id: string
  horizontalPropertyId: string
  unitId: string | null
  personId: string | null
  itemType: string | number
  status: string | number
  receivedAtUtc: string
  receivedByEmployeeId: string | null
  deliveredAtUtc: string | null
  deliveredByEmployeeId: string | null
  carrierOrSender: string | null
  trackingOrReference: string | null
  recipientName: string | null
  notes: string | null
  isActive: boolean
  unitCode?: string
  personName?: string
}

export type ReceptionPendingCount = {
  pendingPickupCount: number
}

export type ReportsOverview = {
  unitCount: number
  billableUnitCount: number
  activeOccupancyCount: number
  totalCoefficient: number
  remainingCoefficientToHundred: number
  openChargesAmount: number
  overdueChargesAmount: number
  collectedAmountThisMonth: number
  pendingReceptionCount: number
  upcomingReservationsCount: number
}

export type CarteraTotals = {
  unitCount: number
  totalBalance: number
  totalOverdue: number
}

export type CarteraItem = {
  unitId: string
  unitCode: string
  unitType: string | number
  balance: number
  overdueBalance: number
  oldestDueDate: string
  chargeCount: number
}

export type CarteraReport = {
  asOfDate: string
  totals: CarteraTotals
  items: CarteraItem[]
}

export type CollectionsTotals = {
  paymentCount: number
  totalAmount: number
}

export type CollectionsByMethod = {
  method: string | number
  count: number
  amount: number
}

export type CollectionsByDay = {
  date: string
  count: number
  amount: number
}

export type CollectionsItem = {
  paymentId: string
  unitId: string
  unitCode: string
  amount: number
  paidAt: string
  method: string | number
  reference: string | null
}

export type CollectionsReport = {
  from: string
  to: string
  totals: CollectionsTotals
  byMethod: CollectionsByMethod[]
  byDay: CollectionsByDay[]
  items: CollectionsItem[]
}

export type OccupancyTotals = {
  unitCount: number
  unitsWithOwner: number
  unitsWithResident: number
  unitsVacant: number
}

export type OccupancyItem = {
  unitId: string
  unitCode: string
  unitType: string | number
  isBillable: boolean
  ownerName?: string | null
  residentName?: string | null
  occupancyCount: number
  hasBillingContact: boolean
}

export type OccupancyReport = {
  totals: OccupancyTotals
  items: OccupancyItem[]
}

export type CoefficientsTotals = {
  unitCount: number
  billableUnitCount: number
  totalCoefficient: number
  remainingToHundred: number
}

export type CoefficientsItem = {
  unitId: string
  unitCode: string
  unitType: string | number
  coefficient: number
  privateBuiltAreaM2: number
  isBillable: boolean
  isActive: boolean
}

export type CoefficientsReport = {
  totals: CoefficientsTotals
  items: CoefficientsItem[]
}

export type ReservationUsageTotals = {
  reservationCount: number
  confirmedCount: number
  cancelledCount: number
  completedCount: number
}

export type ReservationUsageByArea = {
  commonAreaId: string
  commonAreaName: string
  count: number
  confirmedCount: number
}

export type ReservationUsageItem = {
  reservationId: string
  commonAreaName: string
  unitCode: string
  startsAtUtc: string
  endsAtUtc: string
  status: string | number
  attendeesCount: number
}

export type ReservationUsageReport = {
  from: string
  to: string
  totals: ReservationUsageTotals
  byArea: ReservationUsageByArea[]
  items: ReservationUsageItem[]
}

export type ReceptionReportTotals = {
  total: number
  pendingPickup: number
  delivered: number
  returned: number
}

export type ReceptionReportByType = {
  itemType: string | number
  count: number
}

export type ReceptionReportItem = {
  id: string
  itemType: string | number
  unitCode?: string | null
  recipientName?: string | null
  status: string | number
  receivedAtUtc: string
  deliveredAtUtc?: string | null
}

export type ReceptionReport = {
  from: string
  to: string
  totals: ReceptionReportTotals
  byType: ReceptionReportByType[]
  items: ReceptionReportItem[]
}
