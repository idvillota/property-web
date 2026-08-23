import { useQuery } from '@tanstack/react-query'
import { api } from '../api/client'
import type { HorizontalProperty } from '../api/types'
import { buildListUrl, optionsListQuery, type PagedResult } from '../api/paging'

export const PREFERRED_PROPERTY_STORAGE_KEY = 'preferredHorizontalPropertyId'

export function getPreferredPropertyId(): string | null {
  try {
    return localStorage.getItem(PREFERRED_PROPERTY_STORAGE_KEY)
  } catch {
    return null
  }
}

export function setPreferredPropertyId(propertyId: string | null) {
  try {
    if (!propertyId) localStorage.removeItem(PREFERRED_PROPERTY_STORAGE_KEY)
    else localStorage.setItem(PREFERRED_PROPERTY_STORAGE_KEY, propertyId)
  } catch {
    /* ignore */
  }
}

/**
 * Default horizontal property for the tenant (DIFF-002 multi-PH).
 * Prefers local selection, else first active property from list /current.
 */
export function useCurrentProperty() {
  return useQuery({
    queryKey: ['horizontal-property', 'current'],
    queryFn: async () => {
      const preferredId = getPreferredPropertyId()
      try {
        const state = { ...optionsListQuery(), includeInactive: false }
        const { data } = await api.get<PagedResult<HorizontalProperty>>(
          buildListUrl('/api/HorizontalProperties', state),
        )
        const items = data.items ?? []
        if (preferredId) {
          const preferred = items.find((p) => p.id === preferredId)
          if (preferred) return preferred
        }
        if (items[0]) return items[0]
      } catch {
        /* fall through to /current */
      }

      try {
        const { data } = await api.get<HorizontalProperty>('/api/HorizontalProperties/current')
        return data
      } catch (err: unknown) {
        const status = (err as { response?: { status?: number } })?.response?.status
        if (status === 404) return null
        throw err
      }
    },
  })
}
