import { Center, Loader, Stack } from '@mantine/core'
import { useMediaQuery } from '@mantine/hooks'
import type { ReactNode } from 'react'
import type { ListQueryState, PagedResult } from '../../api/paging'
import { EntityList } from '../crud/EntityList'
import { EntityListToolbar } from './EntityListToolbar'
import { DataTableView } from './DataTableView'
import type { ColumnDef } from './types'
import { visibleColumnFilterCount } from './scopeFilters'

type Props<T> = {
  loading: boolean
  data: PagedResult<T> | undefined
  columns: ColumnDef<T>[]
  listState: ListQueryState
  onToggleSort: (sortKey: string) => void
  onColumnFilter: (key: string, value: string) => void
  onClearColumnFilters?: () => void
  onSearchChange: (value: string) => void
  onPageChange: (page: number) => void
  onPageSizeChange: (size: number) => void
  renderCard: (item: T) => ReactNode
  emptyMessage?: string
  searchPlaceholder?: string
  toolbarExtra?: ReactNode
  getRowId?: (row: T) => string
}

/** Tablet and desktop: table; phone: cards with shared toolbar. */
const TABLE_MIN_WIDTH = '(min-width: 48em)'

export function PagedEntityView<T extends { id: string }>({
  loading,
  data,
  columns,
  listState,
  onToggleSort,
  onColumnFilter,
  onClearColumnFilters,
  onSearchChange,
  onPageChange,
  onPageSizeChange,
  renderCard,
  emptyMessage,
  searchPlaceholder,
  toolbarExtra,
  getRowId = (row) => row.id,
}: Props<T>) {
  const showTable = useMediaQuery(TABLE_MIN_WIDTH)

  if (loading && !data) {
    return (
      <Center py="xl">
        <Loader size="sm" />
      </Center>
    )
  }

  if (showTable) {
    return (
      <DataTableView
        columns={columns}
        data={data}
        listState={listState}
        onToggleSort={onToggleSort}
        onColumnFilter={onColumnFilter}
        onClearColumnFilters={onClearColumnFilters}
        onSearchChange={onSearchChange}
        onPageChange={onPageChange}
        onPageSizeChange={onPageSizeChange}
        searchPlaceholder={searchPlaceholder}
        getRowId={getRowId}
        toolbarExtra={toolbarExtra}
      />
    )
  }

  const items = data?.items ?? []
  const activeColumnFilterCount = visibleColumnFilterCount(listState.columnFilters)

  return (
    <Stack gap="md">
      <EntityListToolbar
        listState={listState}
        data={data}
        columns={columns as ColumnDef<unknown>[]}
        onSearchChange={onSearchChange}
        onPageChange={onPageChange}
        onPageSizeChange={onPageSizeChange}
        onClearColumnFilters={onClearColumnFilters}
        onRemoveColumnFilter={(key) => onColumnFilter(key, '')}
        searchPlaceholder={searchPlaceholder}
        activeColumnFilterCount={activeColumnFilterCount}
        extra={toolbarExtra}
      />
      <EntityList loading={loading} empty={items.length === 0} emptyMessage={emptyMessage}>
        {items.map((item) => renderCard(item))}
      </EntityList>
    </Stack>
  )
}
