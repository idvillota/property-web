export const COMMON_AREA_TYPE_OPTIONS = [
  { value: 'SocialRoom', label: 'Social room' },
  { value: 'Bbq', label: 'BBQ' },
  { value: 'Court', label: 'Court' },
  { value: 'Pool', label: 'Pool' },
  { value: 'Gym', label: 'Gym' },
  { value: 'MeetingRoom', label: 'Meeting room' },
  { value: 'Other', label: 'Other' },
] as const

export const RESERVATION_STATUS_OPTIONS = [
  { value: 'Pending', label: 'Pending' },
  { value: 'Confirmed', label: 'Confirmed' },
  { value: 'Cancelled', label: 'Cancelled' },
  { value: 'Completed', label: 'Completed' },
  { value: 'NoShow', label: 'No-show' },
] as const

/** Normalize API enum (name or numeric) to the option value/name. */
export function asEnumName(
  value: string | number | null | undefined,
  options: readonly { value: string; label: string }[],
): string {
  if (value === null || value === undefined || value === '') return ''
  if (typeof value === 'number') return options[value]?.value ?? String(value)
  const asNum = Number(value)
  if (
    Number.isInteger(asNum) &&
    String(asNum) === String(value).trim() &&
    options[asNum]
  ) {
    return options[asNum]!.value
  }
  return String(value)
}

/** Numeric enum value for JSON bodies (API has no JsonStringEnumConverter yet). */
export function enumIndex(
  value: string,
  options: readonly { value: string; label: string }[],
): number {
  const idx = options.findIndex((o) => o.value === value)
  return idx >= 0 ? idx : 0
}

export function labelForOption(
  options: readonly { value: string; label: string }[],
  value: string | number | null | undefined,
) {
  const name = asEnumName(value, options)
  if (!name) return '—'
  return options.find((o) => o.value === name)?.label ?? name
}

export function reservationStatusVariant(
  status: string | number | null | undefined,
): 'warning' | 'success' | 'danger' | 'neutral' {
  const name = asEnumName(status, RESERVATION_STATUS_OPTIONS)
  if (name === 'Pending') return 'warning'
  if (name === 'Confirmed' || name === 'Completed') return 'success'
  if (name === 'Cancelled' || name === 'NoShow') return 'danger'
  return 'neutral'
}

/** Status transitions allowed via POST /api/Reservations/{id}/status */
export function reservationStatusActions(
  status: string | number | null | undefined,
): Array<{ status: string; label: string; color: string }> {
  const name = asEnumName(status, RESERVATION_STATUS_OPTIONS)
  if (name === 'Pending') {
    return [
      { status: 'Confirmed', label: 'Confirm', color: 'teal' },
      { status: 'Cancelled', label: 'Cancel', color: 'red' },
    ]
  }
  if (name === 'Confirmed') {
    return [
      { status: 'Completed', label: 'Complete', color: 'teal' },
      { status: 'Cancelled', label: 'Cancel', color: 'red' },
      { status: 'NoShow', label: 'No-show', color: 'orange' },
    ]
  }
  return []
}
