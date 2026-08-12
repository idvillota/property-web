import { asEnumName, enumIndex, labelForOption } from './amenitiesEnums'

export { asEnumName, enumIndex, labelForOption }

export const RECEPTION_DIRECTION_OPTIONS = [
  { value: 'Inbound', label: 'Entrante' },
  { value: 'Outbound', label: 'Saliente' },
] as const

export const RECEPTION_MANUAL_ITEM_TYPE_OPTIONS = [
  { value: 'Package', label: 'Paquete' },
  { value: 'Letter', label: 'Carta' },
  { value: 'Document', label: 'Documento' },
  { value: 'VisitorMessage', label: 'Mensaje de visitante' },
  { value: 'Other', label: 'Otro' },
] as const

export const UTILITY_BILL_TYPE_OPTIONS = [
  { value: 'WaterBill', label: 'Agua' },
  { value: 'EnergyBill', label: 'Energía' },
  { value: 'GasBill', label: 'Gas' },
  { value: 'AdministrationBill', label: 'Administración' },
] as const

/** All types for labels, filters, and reports (includes bulk-only utility bills). */
export const RECEPTION_ITEM_TYPE_OPTIONS = [
  ...RECEPTION_MANUAL_ITEM_TYPE_OPTIONS,
  { value: 'WaterBill', label: 'Factura de agua' },
  { value: 'EnergyBill', label: 'Factura de energía' },
  { value: 'GasBill', label: 'Factura de gas' },
  { value: 'AdministrationBill', label: 'Factura de administración' },
] as const

export function isUtilityBillItemType(type: string | number | null | undefined) {
  const name = asEnumName(type, RECEPTION_ITEM_TYPE_OPTIONS)
  return UTILITY_BILL_TYPE_OPTIONS.some((o) => o.value === name)
}

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

export function isOutboundDirection(direction: string | number | null | undefined) {
  return asEnumName(direction, RECEPTION_DIRECTION_OPTIONS) === 'Outbound'
}

export function receptionStatusLabel(
  status: string | number | null | undefined,
  direction: string | number | null | undefined,
): string {
  const name = asEnumName(status, RECEPTION_ITEM_STATUS_OPTIONS)
  if (name === 'PendingPickup') {
    return isOutboundDirection(direction)
      ? 'Pendiente de retiro externo'
      : 'Pendiente de entrega a la unidad'
  }
  return labelForOption(RECEPTION_ITEM_STATUS_OPTIONS, status)
}
