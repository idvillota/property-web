/** Must match API FeatureCodes. */
export const FeatureCodes = {
  dashboardView: 'dashboard.view',
  dashboardConfigure: 'dashboard.configure',
  settingsTenant: 'settings.tenant',
  organizationEmployees: 'organization.employees',
  organizationTeam: 'organization.team',
  organizationRoles: 'organization.roles',
} as const

export type FeatureCode = (typeof FeatureCodes)[keyof typeof FeatureCodes]

export const ROLE_LABELS: Record<string, string> = {
  Administrator: 'Administrator',
  Owner: 'Owner',
  Manager: 'Manager',
}

export function hasPermission(permissions: string[], code: string) {
  return permissions.includes(code)
}
