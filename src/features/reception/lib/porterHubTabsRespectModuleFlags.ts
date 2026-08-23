/** Spec DIFF-007 — PorterHub_Tabs_RespectModuleFlags */
export type PorterHubTabId = 'entregas' | 'visitas' | 'parking'

export function porterHubTabsRespectModuleFlags(modules: {
  parking?: boolean
}): PorterHubTabId[] {
  const tabs: PorterHubTabId[] = ['entregas', 'visitas']
  if (modules.parking)
    tabs.push('parking')
  return tabs
}
