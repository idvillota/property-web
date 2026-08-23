/** Spec BIL-014 — LiquidationWizard_ShowsPreviewTotals */
export type LiquidationPreviewTotals = {
  billableUnitCount: number
  chargeCount: number
  totalAmount: number
}

export function liquidationWizardShowsPreviewTotals(
  preview: LiquidationPreviewTotals | null | undefined,
): boolean {
  if (!preview) return false
  return (
    preview.billableUnitCount >= 0 &&
    preview.chargeCount >= 0 &&
    Number.isFinite(preview.totalAmount)
  )
}
