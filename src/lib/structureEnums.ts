export const UNIT_TYPE_OPTIONS = [
  { value: 'Apartment', label: 'Apartment' },
  { value: 'Parking', label: 'Parking' },
  { value: 'Storage', label: 'Storage' },
  { value: 'Commercial', label: 'Commercial' },
  { value: 'Office', label: 'Office' },
  { value: 'Other', label: 'Other' },
] as const

export const PROPERTY_USE_TYPE_OPTIONS = [
  { value: 'Residential', label: 'Residential' },
  { value: 'Mixed', label: 'Mixed use' },
  { value: 'Commercial', label: 'Commercial' },
  { value: 'Tourist', label: 'Tourist' },
] as const

export const DOCUMENT_TYPE_OPTIONS = [
  { value: 'CC', label: 'Cédula (CC)' },
  { value: 'CE', label: 'Cédula extranjería (CE)' },
  { value: 'NIT', label: 'NIT' },
  { value: 'Passport', label: 'Passport' },
  { value: 'TI', label: 'Tarjeta de identidad (TI)' },
] as const

export const OCCUPANCY_ROLE_OPTIONS = [
  { value: 'Owner', label: 'Owner' },
  { value: 'Tenant', label: 'Tenant' },
  { value: 'Resident', label: 'Resident' },
  { value: 'AuthorizedOccupant', label: 'Authorized occupant' },
] as const

export function labelForOption(
  options: readonly { value: string; label: string }[],
  value: string | null | undefined,
) {
  if (!value) return '—'
  return options.find((o) => o.value === value)?.label ?? value
}
