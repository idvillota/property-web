import { useQuery } from '@tanstack/react-query'
import { api } from '../api/client'
import { buildListUrl, type PagedResult } from '../api/paging'
import type { usePagedListState } from './usePagedListState'

export function usePagedListQuery<T>(
  queryKey: string,
  apiPath: string,
  list: ReturnType<typeof usePagedListState>,
) {
  return useQuery({
    queryKey: [queryKey, list.searchParams.toString()],
    queryFn: async () => {
      const { data } = await api.get<PagedResult<T>>(buildListUrl(apiPath, list.effectiveState))
      return data
    },
  })
}
