/** Matches API UnitType enum (serialized as string names). */
export const UNIT_TYPE_OPTIONS = [
  { value: 'Apartment', label: 'Apartamento' },
  { value: 'House', label: 'Casa' },
  { value: 'Parking', label: 'Parqueadero' },
  { value: 'Storage', label: 'Depósito' },
  { value: 'Commercial', label: 'Comercial' },
  { value: 'Other', label: 'Otro' },
] as const

/** Fallback when API still returns numeric enum values. */
const UNIT_TYPE_BY_NUMBER: Record<number, string> = {
  0: 'Apartment',
  1: 'House',
  2: 'Parking',
  3: 'Storage',
  4: 'Commercial',
  5: 'Other',
}

export const PROPERTY_USE_TYPE_OPTIONS = [
  { value: 'Residential', label: 'Residencial' },
  { value: 'Mixed', label: 'Uso mixto' },
  { value: 'Commercial', label: 'Comercial' },
  { value: 'Tourist', label: 'Turístico' },
] as const

export const DOCUMENT_TYPE_OPTIONS = [
  { value: 'CC', label: 'Cédula (CC)' },
  { value: 'CE', label: 'Cédula extranjería (CE)' },
  { value: 'NIT', label: 'NIT' },
  { value: 'Passport', label: 'Pasaporte' },
  { value: 'TI', label: 'Tarjeta de identidad (TI)' },
] as const

export const OCCUPANCY_ROLE_OPTIONS = [
  { value: 'Owner', label: 'Propietario' },
  { value: 'Tenant', label: 'Arrendatario' },
  { value: 'Resident', label: 'Residente' },
  { value: 'AuthorizedOccupant', label: 'Ocupante autorizado' },
] as const

export function normalizeUnitType(value: string | number | null | undefined): string | null {
  if (value === null || value === undefined || value === '') return null
  if (typeof value === 'number') return UNIT_TYPE_BY_NUMBER[value] ?? null
  const asString = String(value)
  if (UNIT_TYPE_OPTIONS.some((o) => o.value === asString)) return asString
  const asNumber = Number(asString)
  if (!Number.isNaN(asNumber) && Number.isInteger(asNumber)) {
    return UNIT_TYPE_BY_NUMBER[asNumber] ?? null
  }
  return asString
}

export function labelForOption(
  options: readonly { value: string; label: string }[],
  value: string | number | null | undefined,
) {
  if (value === null || value === undefined || value === '') return '—'
  const asString = String(value)
  const direct = options.find((o) => o.value === asString)
  if (direct) return direct.label

  const normalized = normalizeUnitType(value)
  if (normalized) {
    const byName = options.find((o) => o.value === normalized)
    if (byName) return byName.label
  }

  return asString
}
