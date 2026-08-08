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
}

export function resolveRoutePermission(pathname: string): FeatureCode | null {
  return ROUTE_PERMISSIONS[pathname] ?? null
}
