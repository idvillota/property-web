/** Spec BIL-010 — PortalAccountPage_RendersBalances */
export type PortalAccountBalanceRow = {
  unitId: string
  code: string
  openBalance: number
}

export function portalAccountPageRendersBalances(
  units: PortalAccountBalanceRow[] | null | undefined,
): boolean {
  return (
    Array.isArray(units) &&
    units.length > 0 &&
    units.every(
      (u) =>
        Boolean(u.unitId && u.code) &&
        typeof u.openBalance === 'number' &&
        Number.isFinite(u.openBalance),
    )
  )
}
