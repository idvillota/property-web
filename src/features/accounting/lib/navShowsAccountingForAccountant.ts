/** ACC-009: Nav_ShowsAccounting_ForAccountant */
export function Nav_ShowsAccounting_ForAccountant(
  permissions: string[],
  accountingModuleEnabled: boolean,
): boolean {
  return (
    accountingModuleEnabled &&
    permissions.some((p) => p.startsWith('accounting.'))
  )
}
