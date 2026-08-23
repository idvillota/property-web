/** Spec PRT-001 — PortalHome_ShowsUnitCards */
export type PortalUnitCardData = {
  unitId: string
  code: string
}

export function portalHomeShowsUnitCards(units: PortalUnitCardData[] | null | undefined): boolean {
  return Array.isArray(units) && units.length > 0 && units.every((u) => Boolean(u.unitId && u.code))
}
