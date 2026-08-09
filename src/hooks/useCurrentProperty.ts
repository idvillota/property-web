import { useQuery } from '@tanstack/react-query'
import { api } from '../api/client'
import type { HorizontalProperty } from '../api/types'

/** Loads the single horizontal property for the current tenant (Colombia 1:1 model). */
export function useCurrentProperty() {
  return useQuery({
    queryKey: ['horizontal-property', 'current'],
    queryFn: async () => {
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
