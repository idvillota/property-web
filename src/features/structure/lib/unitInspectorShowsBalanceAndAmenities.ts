/** Spec DIFF-008 — UnitInspector_ShowsBalanceAndAmenities */
export function unitInspectorShowsBalanceAndAmenities(args: {
  openBalance: number | null | undefined
  amenitiesVisible: boolean
}): boolean {
  return typeof args.openBalance === 'number' && args.amenitiesVisible
}
