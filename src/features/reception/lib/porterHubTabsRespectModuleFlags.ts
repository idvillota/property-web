/** Spec DIFF-007 — PorterHub_Tabs_RespectModuleFlags */
export type PorterHubTabId = 'entregas' | 'visitas' | 'parking'

/**
 * Parking tab follows portería/visits module (no separate `parking` flag in TenantModuleFlags).
 * Callers may also pass `parking: true` when the user has `visitor.parking`.
 */
export function porterHubTabsRespectModuleFlags(modules: {
  visits?: boolean
  parking?: boolean
}): PorterHubTabId[] {
  const tabs: PorterHubTabId[] = ['entregas', 'visitas']
  if (modules.parking || modules.visits) tabs.push('parking')
  return tabs
}
