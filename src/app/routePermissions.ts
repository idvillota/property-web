import { FeatureCodes, type FeatureCode } from '../lib/permissions'

/** Routes only for Platform:AdminEmails users (not tenant feature permissions). */
export const PLATFORM_ONLY_ROUTES = new Set(['/platform/status'])

export function isPlatformOnlyRoute(pathname: string): boolean {
  return PLATFORM_ONLY_ROUTES.has(pathname)
}

/** Route path → required feature permission (must match AppLayout nav). */
export const ROUTE_PERMISSIONS: Record<string, FeatureCode> = {
  '/dashboard': FeatureCodes.dashboardView,
  '/settings/dashboard': FeatureCodes.dashboardConfigure,
  '/settings': FeatureCodes.settingsTenant,
  '/settings/appearance': FeatureCodes.dashboardView,
  '/employees': FeatureCodes.organizationEmployees,
  '/team': FeatureCodes.organizationTeam,
  '/role-permissions': FeatureCodes.organizationRoles,
  '/neighborhoods': FeatureCodes.structureNeighborhoods,
  '/properties': FeatureCodes.structureProperties,
  '/people': FeatureCodes.peopleManage,
}

const DYNAMIC_ROUTE_PERMISSIONS: Array<[RegExp, FeatureCode]> = [
  [/^\/properties\/[^/]+\/buildings(?:\/|$)/, FeatureCodes.structureBuildings],
  [/^\/properties\/[^/]+\/floors(?:\/|$)/, FeatureCodes.structureFloors],
  [/^\/properties\/[^/]+\/units(?:\/|$)/, FeatureCodes.structureUnits],
  [/^\/properties\/[^/]+\/occupancies(?:\/|$)/, FeatureCodes.peopleManage],
  [/^\/properties\/[^/]+\/billing(?:\/|$)/, FeatureCodes.billingSettings],
  [/^\/properties\/[^/]+\/periods(?:\/|$)/, FeatureCodes.billingCharges],
  [/^\/properties\/[^/]+\/charges(?:\/|$)/, FeatureCodes.billingCharges],
  [/^\/properties\/[^/]+\/payments(?:\/|$)/, FeatureCodes.billingPayments],
  [/^\/properties\/[^/]+\/common-areas(?:\/|$)/, FeatureCodes.amenitiesAreas],
  [/^\/properties\/[^/]+\/reservations(?:\/|$)/, FeatureCodes.amenitiesReservations],
  [/^\/properties\/[^/]+\/reception(?:\/|$)/, FeatureCodes.receptionManage],
  [/^\/properties\/[^/]+(?:\/|$)/, FeatureCodes.structureProperties],
]

export function resolveRoutePermission(pathname: string): FeatureCode | null {
  const exact = ROUTE_PERMISSIONS[pathname]
  if (exact) return exact

  for (const [pattern, code] of DYNAMIC_ROUTE_PERMISSIONS) {
    if (pattern.test(pathname)) return code
  }

  return null
}
