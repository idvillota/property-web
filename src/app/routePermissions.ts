import { FeatureCodes, type FeatureCode } from '../lib/permissions'

/** Routes only for Platform:AdminEmails users (not tenant feature permissions). */
export const PLATFORM_ONLY_ROUTES = new Set(['/platform/status'])

export function isPlatformOnlyRoute(pathname: string): boolean {
  return PLATFORM_ONLY_ROUTES.has(pathname)
}

export type RoutePermissionRequirement = FeatureCode | { anyOf: FeatureCode[] }

export function isAnyOfPermission(
  requirement: RoutePermissionRequirement,
): requirement is { anyOf: FeatureCode[] } {
  return typeof requirement === 'object' && requirement !== null && 'anyOf' in requirement
}

/** Route path → required feature permission (must match AppLayout nav). */
export const ROUTE_PERMISSIONS: Record<string, FeatureCode> = {
  '/dashboard': FeatureCodes.dashboardView,
  '/settings/dashboard': FeatureCodes.dashboardConfigure,
  '/settings': FeatureCodes.settingsTenant,
  '/settings/appearance': FeatureCodes.dashboardView,
  '/settings/audit': FeatureCodes.auditView,
  '/employees': FeatureCodes.organizationEmployees,
  '/team': FeatureCodes.organizationTeam,
  '/role-permissions': FeatureCodes.organizationRoles,
  '/neighborhoods': FeatureCodes.structureNeighborhoods,
  '/vehicle-brands': FeatureCodes.structureVehicleBrands,
  '/properties': FeatureCodes.structureProperties,
  '/people': FeatureCodes.peopleManage,
}

const DYNAMIC_ROUTE_PERMISSIONS: Array<[RegExp, RoutePermissionRequirement]> = [
  [/^\/properties\/[^/]+\/estructura(?:\/|$)/, FeatureCodes.structureBuildings],
  [/^\/properties\/[^/]+\/matriz(?:\/|$)/, FeatureCodes.structureBuildings],
  [/^\/properties\/[^/]+\/buildings(?:\/|$)/, FeatureCodes.structureBuildings],
  [/^\/properties\/[^/]+\/floors(?:\/|$)/, FeatureCodes.structureFloors],
  [/^\/properties\/[^/]+\/units(?:\/|$)/, FeatureCodes.structureUnits],
  [/^\/properties\/[^/]+\/occupancies(?:\/|$)/, FeatureCodes.peopleManage],
  [/^\/properties\/[^/]+\/vehicles(?:\/|$)/, FeatureCodes.structureUnits],
  [/^\/properties\/[^/]+\/billing(?:\/|$)/, FeatureCodes.billingSettings],
  [/^\/properties\/[^/]+\/periods(?:\/|$)/, FeatureCodes.billingCharges],
  [/^\/properties\/[^/]+\/charges(?:\/|$)/, FeatureCodes.billingCharges],
  [/^\/properties\/[^/]+\/payments(?:\/|$)/, FeatureCodes.billingPayments],
  [/^\/properties\/[^/]+\/payment-intents(?:\/|$)/, FeatureCodes.billingPayments],
  [/^\/properties\/[^/]+\/billing\/dunning(?:\/|$)/, FeatureCodes.billingCharges],
  [/^\/properties\/[^/]+\/common-areas(?:\/|$)/, FeatureCodes.amenitiesAreas],
  [/^\/properties\/[^/]+\/reservations(?:\/|$)/, FeatureCodes.amenitiesReservations],
  [/^\/properties\/[^/]+\/mural(?:\/|$)/, FeatureCodes.muralManage],
  [/^\/properties\/[^/]+\/pqrs(?:\/|$)/, FeatureCodes.pqrsManage],
  [
    /^\/properties\/[^/]+\/reception\/hub(?:\/|$)/,
    { anyOf: [FeatureCodes.receptionManage, FeatureCodes.receptionVisits] },
  ],
  // More specific than /reception — manage OR visits (REC-010)
  [
    /^\/properties\/[^/]+\/reception\/visitors(?:\/|$)/,
    { anyOf: [FeatureCodes.receptionManage, FeatureCodes.receptionVisits] },
  ],
  [/^\/properties\/[^/]+\/reception(?:\/|$)/, FeatureCodes.receptionManage],
  [/^\/guard(?:\/|$)/, { anyOf: [FeatureCodes.receptionManage, FeatureCodes.receptionVisits] }],
  [/^\/properties\/[^/]+\/reports(?:\/|$)/, FeatureCodes.reportsView],
  [/^\/properties\/[^/]+\/accounting\/coa(?:\/|$)/, FeatureCodes.accountingCoa],
  [/^\/properties\/[^/]+\/accounting\/journals(?:\/|$)/, FeatureCodes.accountingJournals],
  [/^\/properties\/[^/]+\/accounting\/budget(?:\/|$)/, FeatureCodes.accountingBudget],
  [/^\/properties\/[^/]+\/accounting\/ap(?:\/|$)/, FeatureCodes.accountingAp],
  [/^\/properties\/[^/]+\/accounting\/petty-cash(?:\/|$)/, FeatureCodes.accountingPettyCash],
  [/^\/properties\/[^/]+\/accounting\/tax(?:\/|$)/, FeatureCodes.accountingTax],
  [/^\/properties\/[^/]+\/accounting\/reports(?:\/|$)/, FeatureCodes.accountingReports],
  [/^\/properties\/[^/]+\/accounting\/bank-rec(?:\/|$)/, FeatureCodes.accountingBank],
  [/^\/properties\/[^/]+\/accounting(?:\/|$)/, FeatureCodes.accountingCoa],
  [/^\/properties\/[^/]+(?:\/|$)/, FeatureCodes.structureProperties],
]

export function resolveRoutePermission(pathname: string): RoutePermissionRequirement | null {
  const exact = ROUTE_PERMISSIONS[pathname]
  if (exact) return exact

  for (const [pattern, code] of DYNAMIC_ROUTE_PERMISSIONS) {
    if (pattern.test(pathname)) return code
  }

  return null
}
