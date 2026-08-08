import { useDebouncedValue } from '@mantine/hooks'
import { useCallback, useMemo, useState } from 'react'
import { defaultListQuery, listQueryToSearchParams, type ListQueryState } from '../api/paging'

export function usePagedListState(initialSortBy = 'name', initial?: Partial<ListQueryState>) {
  const [state, setState] = useState<ListQueryState>(() => ({
    ...defaultListQuery(initialSortBy),
    ...initial,
  }))

  const [debouncedSearch] = useDebouncedValue(state.search, 400)

  const effectiveState = useMemo(
    (): ListQueryState => ({ ...state, search: debouncedSearch }),
    [state, debouncedSearch],
  )

  const searchParams = useMemo(
    () => listQueryToSearchParams(effectiveState),
    [effectiveState],
  )

  const toggleSort = useCallback((sortKey: string) => {
    setState((prev) => ({
      ...prev,
      page: 1,
      sortBy: sortKey,
      sortDir: prev.sortBy === sortKey && prev.sortDir === 'asc' ? 'desc' : 'asc',
    }))
  }, [])

  const setColumnFilter = useCallback((key: string, value: string) => {
    const normalized = value.trim()
    setState((prev) => ({
      ...prev,
      page: 1,
      columnFilters: normalized
        ? { ...prev.columnFilters, [key]: normalized }
        : Object.fromEntries(
            Object.entries(prev.columnFilters).filter(([k]) => k !== key),
          ),
    }))
  }, [])

  const setSearch = useCallback((search: string) => {
    setState((prev) => ({ ...prev, page: 1, search }))
  }, [])

  const setPage = useCallback((page: number) => {
    setState((prev) => ({ ...prev, page }))
  }, [])

  const setPageSize = useCallback((pageSize: number) => {
    setState((prev) => ({ ...prev, page: 1, pageSize }))
  }, [])

  const setIncludeInactive = useCallback((includeInactive: boolean) => {
    setState((prev) => ({ ...prev, page: 1, includeInactive }))
  }, [])

  const clearColumnFilters = useCallback(() => {
    setState((prev) => ({ ...prev, page: 1, columnFilters: {} }))
  }, [])

  return {
    state,
    effectiveState,
    searchParams,
    toggleSort,
    setColumnFilter,
    clearColumnFilters,
    setSearch,
    setPage,
    setPageSize,
    setIncludeInactive,
  }
}
