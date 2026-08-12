import { useMemo } from 'react'
import type { Building } from '../api/types'
import { useEntityOptions } from './useEntityOptions'

/** Map buildingId → building for unit option labels. */
export function useBuildingById(propertyId: string, enabled = true) {
  const buildings = useEntityOptions<Building>(
    'building-options',
    '/api/Buildings',
    { horizontalPropertyId: propertyId },
    enabled && !!propertyId,
  )

  const buildingById = useMemo(() => {
    const map = new Map<string, Building>()
    for (const b of buildings.data ?? []) map.set(b.id, b)
    return map
  }, [buildings.data])

  return { buildingById, isLoading: buildings.isLoading }
}
