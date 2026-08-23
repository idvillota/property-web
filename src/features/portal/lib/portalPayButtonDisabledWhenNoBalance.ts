/** Spec BIL-011 — PortalPayButton_Disabled_WhenNoBalance */
export function portalPayButtonDisabledWhenNoBalance(
  openBalance: number | null | undefined,
): boolean {
  return openBalance == null || Number(openBalance) <= 0
}
