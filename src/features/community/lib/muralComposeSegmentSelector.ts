import { OCCUPANCY_ROLE_OPTIONS } from '../../../lib/structureEnums'

/** Spec COM-010 — MuralCompose_SegmentSelector */
export type MuralSegmentSelection = {
  buildingIds: string[]
  floorIds: string[]
  occupancyRoles: string[]
}

export type MuralSegmentOption = { value: string; label: string }

export function muralComposeSegmentSelector(
  selection: MuralSegmentSelection,
  options?: {
    buildings?: MuralSegmentOption[]
    floors?: MuralSegmentOption[]
  },
): { isValid: boolean; isBroadcast: boolean; previewLabel: string } {
  const buildingIds = (selection.buildingIds ?? []).filter(Boolean)
  const floorIds = (selection.floorIds ?? []).filter(Boolean)
  const occupancyRoles = (selection.occupancyRoles ?? []).filter(Boolean)
  const isBroadcast = buildingIds.length === 0 && floorIds.length === 0 && occupancyRoles.length === 0

  if (isBroadcast) {
    return {
      isValid: true,
      isBroadcast: true,
      previewLabel: 'Quién recibirá: todos los residentes y propietarios del conjunto',
    }
  }

  const parts: string[] = []
  if (buildingIds.length > 0) {
    const labels = buildingIds.map(
      (id) => options?.buildings?.find((b) => b.value === id)?.label ?? 'Torre',
    )
    parts.push(labels.join(', '))
  }
  if (floorIds.length > 0) {
    const labels = floorIds.map(
      (id) => options?.floors?.find((f) => f.value === id)?.label ?? 'Piso',
    )
    parts.push(labels.join(', '))
  }
  if (occupancyRoles.length > 0) {
    const labels = occupancyRoles.map(
      (role) => OCCUPANCY_ROLE_OPTIONS.find((o) => o.value === role)?.label ?? role,
    )
    parts.push(labels.join(', '))
  }

  return {
    isValid: true,
    isBroadcast: false,
    previewLabel: `Quién recibirá: ${parts.join(' · ')}`,
  }
}
