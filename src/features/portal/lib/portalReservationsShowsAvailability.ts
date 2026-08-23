/** Spec COM-014 — PortalReservations_ShowsAvailability */
export type PortalAvailabilitySlot = {
  startsAtUtc: string
  endsAtUtc: string
}

export function portalReservationsShowsAvailability(
  occupied: PortalAvailabilitySlot[] | null | undefined,
): boolean {
  return (
    Array.isArray(occupied) &&
    occupied.every(
      (s) =>
        Boolean(s.startsAtUtc && s.endsAtUtc) &&
        new Date(s.endsAtUtc).getTime() > new Date(s.startsAtUtc).getTime(),
    )
  )
}
