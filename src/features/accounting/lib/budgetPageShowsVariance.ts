/** ACC-003: BudgetPage_ShowsVariance */
export function BudgetPage_ShowsVariance(rows: { variance: number }[]): boolean {
  return rows.some((r) => r.variance !== 0) || rows.length > 0
}
