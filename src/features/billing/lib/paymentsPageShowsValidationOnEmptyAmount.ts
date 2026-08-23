/** Spec BIL-004 — PaymentsPage_ShowsValidation_OnEmptyAmount */
export function paymentsPageShowsValidationOnEmptyAmount(
  amount: number | null | undefined,
): string | null {
  if (amount == null || Number.isNaN(Number(amount)) || Number(amount) <= 0) {
    return 'Debe ser mayor que cero'
  }
  return null
}
