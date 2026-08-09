import { asEnumName, enumIndex, labelForOption } from './amenitiesEnums'

export { asEnumName, enumIndex, labelForOption }

export const RECEPTION_ITEM_TYPE_OPTIONS = [
  { value: 'Package', label: 'Paquete' },
  { value: 'Letter', label: 'Carta' },
  { value: 'Document', label: 'Documento' },
  { value: 'VisitorMessage', label: 'Mensaje de visitante' },
  { value: 'Other', label: 'Otro' },
] as const

export const RECEPTION_ITEM_STATUS_OPTIONS = [
  { value: 'PendingPickup', label: 'Pendiente de retiro' },
  { value: 'Delivered', label: 'Entregado' },
  { value: 'Returned', label: 'Devuelto' },
  { value: 'Cancelled', label: 'Cancelado' },
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
