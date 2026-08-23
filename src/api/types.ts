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
  modules?: TenantModuleFlags
  hasPersonLink?: boolean
  unitIds?: string[]
}

export type PortalUnitCard = {
  unitId: string
  code: string
  occupancyRole: string
  isPrimary: boolean
}

export type PortalQuickLink = {
  id: string
  label: string
  path: string
  available: boolean
}

export type PortalHome = {
  personId: string
  personFullName: string
  propertyName: string | null
  units: PortalUnitCard[]
  quickLinks: PortalQuickLink[]
}

export type PortalAccountUnit = {
  unitId: string
  code: string
  openBalance: number
  overdueBalance: number
  openChargeCount: number
}

export type PortalAccountPayment = {
  paymentId: string
  unitId: string
  unitCode: string
  amount: number
  paidAt: string
  method: string | number
}

export type PortalAccount = {
  personId: string
  personFullName: string
  openBalance: number
  overdueBalance: number
  openChargeCount: number
  units: PortalAccountUnit[]
  recentPayments: PortalAccountPayment[]
}

export type PortalAccountCharge = {
  feeChargeId: string
  description: string
  periodKey: string | null
  chargeType: string | number
  amount: number
  amountPaid: number
  balance: number
  dueDate: string
  status: string | number
}

export type PortalAccountUnitDetail = {
  unitId: string
  code: string
  openBalance: number
  overdueBalance: number
  openCharges: PortalAccountCharge[]
  recentPayments: PortalAccountPayment[]
}

export type PaymentIntentAllocation = {
  feeChargeId: string
  amount: number
}

export type PaymentIntent = {
  id: string
  idempotencyKey: string
  providerRef: string | null
  provider: string
  status: string | number
  horizontalPropertyId: string
  unitId: string
  personId: string | null
  amount: number
  paymentId: string | null
  failureReason: string | null
  paidAtUtc: string | null
  createdAtUtc: string
  allocations: PaymentIntentAllocation[]
}

export type PortalCheckout = {
  intent: PaymentIntent
  checkoutUrl: string
  isMockCheckout: boolean
  provider: string
}

export type PortalCommonArea = {
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
}

export type PortalReservationSlot = {
  startsAtUtc: string
  endsAtUtc: string
}

export type PortalReservation = {
  id: string
  commonAreaId: string
  commonAreaName: string
  unitId: string
  unitCode: string
  startsAtUtc: string
  endsAtUtc: string
  status: string | number
  attendeesCount: number
  notes: string | null
  isActive: boolean
  canCancel: boolean
}

export type TenantModuleFlags = {
  portal: boolean
  digitalPayments: boolean
  accounting: boolean
  visits: boolean
  assemblies: boolean
}

export type FileAsset = {
  id: string
  fileName: string
  contentType: string
  sizeBytes: number
  purpose: string | null
  createdByUserId: string | null
  createdAtUtc: string
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
  propertyId: string | null
  name: string
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
  neighborhoodId: string | null
  propertyUseType: string | null
  matriculaInmobiliaria: string | null
  regulationNotes: string | null
  coefficientBasisNotes: string | null
  isActive: boolean
  hasProperty: boolean
  modules: TenantModuleFlags
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
  legalName: string | null
  nit: string | null
  taxRegime: string | null
  legalRepresentative: string | null
  addressLine: string
  city: string
  country: string
  postalCode: string | null
  phone: string | null
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
  parkingCount: number
  terraceCount: number
  storageCount: number
  isDoubleParking: boolean
  isBillable: boolean
  isPaymentUpToDate: boolean
  isActive: boolean
}

export type StructureWorkspaceFloor = {
  id: string
  name: string
  number: number | null
  sortOrder: number
  units: Unit[]
}

export type StructureWorkspaceBuilding = {
  id: string
  name: string
  code: string | null
  sortOrder: number
  floors: StructureWorkspaceFloor[]
}

export type StructureWorkspace = {
  horizontalPropertyId: string
  hasStructure: boolean
  buildingCount: number
  floorCount: number
  unitCount: number
  buildings: StructureWorkspaceBuilding[]
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
  isCommunicationResponsible: boolean
  startDate: string
  endDate: string | null
  isActive: boolean
  unitCode?: string
  personName?: string
}

export type StructureComposerStatus = {
  horizontalPropertyId: string
  hasStructure: boolean
  buildingCount: number
  floorCount: number
  unitCount: number
}

export type StructureComposerBuildingInput = {
  name: string
  code: string | null
  floorFrom: number
  floorTo: number
  unitsPerFloor: number
  includeBasement: boolean
  includeRooftop: boolean
  codePattern: string
  defaultUnitType: string
  defaultAreaM2: number
}

export type StructureComposerRequest = {
  horizontalPropertyId: string
  buildings: StructureComposerBuildingInput[]
  parking: {
    count: number
    prefix: string
    areaM2: number
    linkToApartmentsInOrder: boolean
  } | null
  storage: {
    count: number
    prefix: string
    areaM2: number
  } | null
  unitOverrides: Array<{
    code: string
    unitType?: string
    areaM2?: number
    parkingCount?: number
    terraceCount?: number
    storageCount?: number
    remove?: boolean
  }>
}

export type StructureComposerPreviewUnit = {
  code: string
  unitType: string
  areaM2: number
  buildingCode: string | null
  floorName: string | null
  linkedUnitCode: string | null
}

export type StructureComposerPreview = {
  buildingCount: number
  floorCount: number
  unitCount: number
  dwellingCount: number
  parkingCount: number
  storageCount: number
  totalAreaM2: number
  warnings: string[]
  buildings: Array<{
    name: string
    code: string | null
    floors: Array<{
      name: string
      number: number | null
      units: StructureComposerPreviewUnit[]
    }>
  }>
  ancillaryUnits: StructureComposerPreviewUnit[]
}

export type StructureComposerCommitResult = {
  buildingsCreated: number
  floorsCreated: number
  unitsCreated: number
  totalCoefficient: number
}

export type UnitHouseholdPerson = {
  occupancyId: string
  personId: string
  fullName: string
  documentLabel: string
  email: string | null
  phone: string | null
  role: string
  isPrimary: boolean
  receivesBilling: boolean
  isCommunicationResponsible: boolean
}

export type UnitAmenityLink = {
  unitId: string
  code: string
}

export type VehicleBrand = {
  id: string
  name: string
  isActive: boolean
}

export type Vehicle = {
  id: string
  horizontalPropertyId: string
  unitId: string | null
  unitCode: string | null
  vehicleBrandId: string
  vehicleType: string
  brand: string
  model: string
  color: string
  plate: string
  isActive: boolean
}

export type UnitHousehold = {
  unitId: string
  unitCode: string
  unitType: string
  buildingId: string | null
  buildingName: string | null
  floorId: string | null
  floorName: string | null
  privateBuiltAreaM2: number
  coefficient: number
  parkingCount: number
  terraceCount: number
  storageCount: number
  owners: UnitHouseholdPerson[]
  habitants: UnitHouseholdPerson[]
  relatedParkings: UnitAmenityLink[]
  relatedTerraces: UnitAmenityLink[]
  relatedStorages: UnitAmenityLink[]
}

export type UserPersonLink = {
  id: string
  userId: string
  userEmail: string
  personId: string
  personFullName: string
  isActive: boolean
  unitIds: string[]
}

export type LinkUserToPersonRequest = {
  userId?: string | null
  email?: string | null
}

export type PersonOverview = {
  personId: string
  fullName: string
  documentLabel: string
  email: string | null
  phone: string | null
  units: PersonUnitLink[]
  paymentStatus: PersonPaymentStatus
  reservations: PersonReservationItem[]
}

export type PersonUnitLink = {
  unitId: string
  unitCode: string
  unitType: string
  role: string
  buildingName: string | null
  floorName: string | null
  isPrimary: boolean
  receivesBilling: boolean
  openBalance: number
  overdueBalance: number
}

export type PersonPaymentStatus = {
  openBalance: number
  overdueBalance: number
  paidLast90Days: number
  openChargeCount: number
  recentPayments: PersonPaymentItem[]
}

export type PersonPaymentItem = {
  paymentId: string
  unitId: string
  unitCode: string
  amount: number
  paidAt: string
  method: string | number
}

export type PersonReservationItem = {
  reservationId: string
  commonAreaName: string
  unitCode: string
  startsAtUtc: string
  endsAtUtc: string
  status: string | number
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

export type DunningRule = {
  id: string
  horizontalPropertyId: string
  daysOverdue: number
  isEnabled: boolean
  cooldownDays: number
  emailSubjectTemplate: string
  emailBodyTemplate: string
}

export type DunningSendLog = {
  id: string
  horizontalPropertyId: string
  unitId: string
  unitCode: string | null
  dunningRuleId: string
  daysOverdueSnapshot: number
  balanceSnapshot: number
  toEmail: string
  sentAtUtc: string
}

export type BillingPeriod = {
  id: string
  horizontalPropertyId: string
  year: number
  month: number
  periodKey: string
  status: string | number
  notes: string | null
  isLiquidated: boolean
  liquidatedAtUtc: string | null
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

export type LiquidationPreview = {
  billingPeriodId: string
  periodKey: string
  isLiquidated: boolean
  billableUnitCount: number
  chargeCount: number
  totalAmount: number
  monthlyBudgetAmount: number
  dueDate: string
}

export type LiquidationResult = {
  billingPeriodId: string
  periodKey: string
  createdCount: number
  totalAmount: number
  isLiquidated: boolean
  liquidatedAtUtc: string | null
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
  /** Open charge balance for the unit after create (BIL-004). */
  unitOpenBalanceAfter?: number
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
  direction: string | number
  itemType: string | number
  status: string | number
  receivedAtUtc: string
  receivedByEmployeeId: string | null
  deliveredAtUtc: string | null
  deliveredByEmployeeId: string | null
  deliveredToPersonId: string | null
  carrierOrSender: string | null
  trackingOrReference: string | null
  recipientName: string | null
  authorizedPickupName1: string | null
  authorizedPickupName2: string | null
  deliveredToExternalName: string | null
  notes: string | null
  isActive: boolean
  unitCode?: string
  personName?: string
  deliveredToPersonName?: string
}

export type ReceptionPendingCount = {
  pendingPickupCount: number
}

export type VisitLog = {
  id: string
  horizontalPropertyId: string
  unitId: string
  unitCode: string
  visitorPersonId: string
  visitorFullName: string
  documentType: string | number
  documentNumber: string
  enteredAtUtc: string
  status: string | number
  notes: string | null
  visitorWasReused?: boolean
}

export type MuralPost = {
  id: string
  horizontalPropertyId: string
  kind: string | number
  category: string | number
  title: string
  body: string
  contactPhone: string | null
  contactEmail: string | null
  contactNote: string | null
  areaLabel: string | null
  unitId: string | null
  unitCode?: string | null
  authorUserId: string | null
  authorDisplayName: string
  isPinned: boolean
  isHidden: boolean
  publishedAtUtc: string
  expiresAtUtc: string | null
  isActive: boolean
  isExpired: boolean
  audienceBuildingIds?: string[]
  audienceFloorIds?: string[]
  audienceOccupancyRoles?: Array<string | number>
  readCount?: number
  recipientCount?: number
  readPercent?: number
}

export type PqrsComment = {
  id: string
  pqrsCaseId: string
  authorUserId: string | null
  authorPersonId: string | null
  authorDisplayName: string
  body: string
  isInternal: boolean
  postedAtUtc: string
}

export type PqrsCase = {
  id: string
  horizontalPropertyId: string
  unitId: string
  unitCode?: string | null
  createdByPersonId: string
  createdByPersonName?: string | null
  createdByUserId: string | null
  category: string | number
  subject: string
  description: string
  status: string | number
  dueAtUtc: string | null
  assignedToUserId: string | null
  attachmentFileAssetIds: string[]
  isActive: boolean
  createdAtUtc: string
  updatedAtUtc?: string | null
  comments?: PqrsComment[]
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
