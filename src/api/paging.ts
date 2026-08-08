export type PagedResult<T> = {
  items: T[]
  totalCount: number
  page: number
  pageSize: number
  totalPages: number
}

export type ListQueryState = {
  page: number
  pageSize: number
  sortBy: string
  sortDir: 'asc' | 'desc'
  search: string
  includeInactive: boolean
  columnFilters: Record<string, string>
}

export const PAGE_SIZE_OPTIONS = ['10', '25', '50', '100'] as const

export const defaultListQuery = (sortBy = 'name'): ListQueryState => ({
  page: 1,
  pageSize: 25,
  sortBy,
  sortDir: 'asc',
  search: '',
  includeInactive: false,
  columnFilters: {},
})

export function listQueryToSearchParams(state: ListQueryState): URLSearchParams {
  const params = new URLSearchParams()
  params.set('page', String(state.page))
  params.set('pageSize', String(state.pageSize))
  params.set('sortBy', state.sortBy)
  params.set('sortDir', state.sortDir)
  if (state.search.trim()) params.set('search', state.search.trim())
  if (state.includeInactive) params.set('includeInactive', 'true')
  for (const [key, value] of Object.entries(state.columnFilters)) {
    const trimmed = String(value).trim()
    if (trimmed) params.set(`filters[${key}]`, trimmed)
  }
  return params
}

export function buildListUrl(path: string, state: ListQueryState): string {
  const query = listQueryToSearchParams(state).toString()
  return query ? `${path}?${query}` : path
}

/** Load up to 100 rows for select dropdowns. */
export function optionsListQuery(sortBy = 'name'): ListQueryState {
  return { ...defaultListQuery(sortBy), page: 1, pageSize: 100 }
}
