/** Spec DIFF-002 — PropertySwitcher_ListsAuthorized */
export type PropertyListItem = {
  id: string
  name: string
  isActive: boolean
}

/** Returns properties the user may switch to (active only unless includeInactive). */
export function PropertySwitcher_ListsAuthorized(
  properties: PropertyListItem[],
  includeInactive = false,
): PropertyListItem[] {
  if (includeInactive) return properties
  return properties.filter((p) => p.isActive)
}
