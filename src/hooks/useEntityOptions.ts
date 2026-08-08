import { useQuery } from '@tanstack/react-query'
import { api } from '../api/client'
import { buildListUrl, optionsListQuery, type PagedResult } from '../api/paging'

/** Load up to 100 rows for select dropdowns, optionally filtered. */
export function useEntityOptions<T>(
  queryKey: string,
  apiPath: string,
  filters?: Record<string, string>,
  enabled = true,
) {
  return useQuery({
    queryKey: [queryKey, filters ?? {}],
    enabled,
    queryFn: async () => {
      const state = { ...optionsListQuery(), columnFilters: filters ?? {} }
      const { data } = await api.get<PagedResult<T>>(buildListUrl(apiPath, state))
      return data.items
    },
  })
}
