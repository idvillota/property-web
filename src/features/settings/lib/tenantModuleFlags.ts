/** Spec ARCH-002 — TenantSettings_ModuleToggles_Persist */
import type { TenantModuleFlags } from '../../../api/types'

export type { TenantModuleFlags }

export const DEFAULT_TENANT_MODULES: TenantModuleFlags = {
  portal: true,
  digitalPayments: false,
  accounting: false,
  visits: false,
  assemblies: false,
}

/** Pure helper: saved payload should round-trip the toggles admin selected. */
export function tenantSettingsModuleTogglesPersist(
  before: TenantModuleFlags,
  after: TenantModuleFlags,
): boolean {
  return (
    before.portal === after.portal &&
    before.digitalPayments === after.digitalPayments &&
    before.accounting === after.accounting &&
    before.visits === after.visits &&
    before.assemblies === after.assemblies
  )
}

export function isTenantModuleEnabled(
  modules: TenantModuleFlags | null | undefined,
  key: keyof TenantModuleFlags,
): boolean {
  if (!modules) return key === 'portal'
  return Boolean(modules[key])
}
