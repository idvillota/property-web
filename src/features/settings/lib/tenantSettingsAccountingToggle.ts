/** Spec DIFF-005 — TenantSettings_AccountingToggle */
export const TENANT_SETTINGS_ACCOUNTING_FIELD = 'moduleAccounting' as const

/** Documents/asserts the tenant settings form includes the Contabilidad module toggle. */
export function TenantSettings_AccountingToggle(formFieldKeys: string[]): boolean {
  return formFieldKeys.includes(TENANT_SETTINGS_ACCOUNTING_FIELD)
}
