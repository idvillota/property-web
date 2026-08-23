/** ACC-007: TaxSettings_SaveRates */
export function TaxSettings_SaveRates(ratePercent: number, name: string): boolean {
  return name.trim().length > 0 && ratePercent >= 0
}
