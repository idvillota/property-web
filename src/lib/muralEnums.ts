import { asEnumName, enumIndex, labelForOption } from './amenitiesEnums'

export { asEnumName, enumIndex, labelForOption }

export const MURAL_KIND_OPTIONS = [
  { value: 'Official', label: 'Oficial' },
  { value: 'Community', label: 'Comunidad' },
] as const

export const MURAL_CATEGORY_OPTIONS = [
  { value: 'Maintenance', label: 'Mantenimiento' },
  { value: 'Events', label: 'Eventos' },
  { value: 'Committees', label: 'Comités / asamblea' },
  { value: 'Parking', label: 'Parqueaderos' },
  { value: 'Services', label: 'Servicios y recomendaciones' },
  { value: 'Help', label: 'Se busca / se ofrece ayuda' },
  { value: 'Other', label: 'Otros' },
] as const

export function isOfficialMuralKind(kind: string | number | null | undefined) {
  return asEnumName(kind, MURAL_KIND_OPTIONS) === 'Official'
}
