/** ACC-006: BankRec_UI_MatchAction */
export function BankRec_UI_MatchAction(lineId: string | null, paymentId: string | null): boolean {
  return Boolean(lineId && paymentId)
}
