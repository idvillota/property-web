import { asEnumName, enumIndex, labelForOption } from './amenitiesEnums'

export { asEnumName, enumIndex, labelForOption }

export const RECEPTION_ITEM_TYPE_OPTIONS = [
  { value: 'Package', label: 'Package' },
  { value: 'Letter', label: 'Letter' },
  { value: 'Document', label: 'Document' },
  { value: 'VisitorMessage', label: 'Visitor message' },
  { value: 'Other', label: 'Other' },
] as const

export const RECEPTION_ITEM_STATUS_OPTIONS = [
  { value: 'PendingPickup', label: 'Pending pickup' },
  { value: 'Delivered', label: 'Delivered' },
  { value: 'Returned', label: 'Returned' },
  { value: 'Cancelled', label: 'Cancelled' },
] as const

export function receptionStatusVariant(
  status: string | number | null | undefined,
): 'warning' | 'success' | 'danger' | 'neutral' {
  const name = asEnumName(status, RECEPTION_ITEM_STATUS_OPTIONS)
  if (name === 'PendingPickup') return 'warning'
  if (name === 'Delivered') return 'success'
  if (name === 'Returned' || name === 'Cancelled') return 'danger'
  return 'neutral'
}

export function isPendingPickup(status: string | number | null | undefined) {
  return asEnumName(status, RECEPTION_ITEM_STATUS_OPTIONS) === 'PendingPickup'
}
