/** ACC-008: ClosePeriod_ConfirmDialog */
export function ClosePeriod_ConfirmDialog(confirmed: boolean, year: number, month: number): boolean {
  return confirmed && year >= 2000 && month >= 1 && month <= 12
}
