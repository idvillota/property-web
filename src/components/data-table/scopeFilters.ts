/** Filters used for tenant/property scoping — not shown as user-facing chips. */
const HIDDEN_SCOPE_FILTER_KEYS = new Set(['horizontalPropertyId'])

export function isHiddenScopeFilter(key: string): boolean {
  return HIDDEN_SCOPE_FILTER_KEYS.has(key)
}

export function visibleColumnFilters(
  columnFilters: Record<string, string>,
): Record<string, string> {
  return Object.fromEntries(
    Object.entries(columnFilters).filter(([key]) => !isHiddenScopeFilter(key)),
  )
}

export function visibleColumnFilterCount(columnFilters: Record<string, string>): number {
  return Object.keys(visibleColumnFilters(columnFilters)).length
}
