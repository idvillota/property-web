import type { ListQueryState, PagedResult } from '../../api/paging'
import type { ColumnDef } from './types'
import { EntityListToolbar } from './EntityListToolbar'
import { visibleColumnFilterCount } from './scopeFilters'

type Props = {
  data: PagedResult<unknown> | undefined
  listState: ListQueryState
  columns?: ColumnDef<unknown>[]
  onSearchChange: (value: string) => void
  onPageChange: (page: number) => void
  onPageSizeChange: (size: number) => void
  onClearColumnFilters?: () => void
  onColumnFilter?: (key: string, value: string) => void
  searchPlaceholder?: string
}

/** @deprecated Prefer EntityListToolbar via PagedEntityView */
export function ListQueryFooter({
  data,
  listState,
  columns = [],
  onSearchChange,
  onPageChange,
  onPageSizeChange,
  onClearColumnFilters,
  onColumnFilter,
  searchPlaceholder,
}: Props) {
  return (
    <EntityListToolbar
      listState={listState}
      data={data}
      columns={columns}
      onSearchChange={onSearchChange}
      onPageChange={onPageChange}
      onPageSizeChange={onPageSizeChange}
      onClearColumnFilters={onClearColumnFilters}
      onRemoveColumnFilter={onColumnFilter ? (key) => onColumnFilter(key, '') : undefined}
      searchPlaceholder={searchPlaceholder}
      activeColumnFilterCount={visibleColumnFilterCount(listState.columnFilters)}
    />
  )
}
