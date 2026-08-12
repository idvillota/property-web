import {
  Button,
  Center,
  Paper,
  ScrollArea,
  Select,
  Stack,
  Table,
  Text,
  TextInput,
} from '@mantine/core'
import { useDebouncedValue } from '@mantine/hooks'
import { IconFilterOff } from '@tabler/icons-react'
import { useEffect, useMemo, useState } from 'react'
import type { ListQueryState, PagedResult } from '../../api/paging'
import { SortHeader } from './SortHeader'
import type { ColumnAlign, ColumnDef } from './types'
import { EntityListToolbar } from './EntityListToolbar'
import { visibleColumnFilterCount } from './scopeFilters'

type Props<T> = {
  columns: ColumnDef<T>[]
  data: PagedResult<T> | undefined
  listState: ListQueryState
  onToggleSort: (sortKey: string) => void
  onColumnFilter: (key: string, value: string) => void
  onClearColumnFilters?: () => void
  onSearchChange: (value: string) => void
  onPageChange: (page: number) => void
  onPageSizeChange: (size: number) => void
  searchPlaceholder?: string
  getRowId?: (row: T) => string
  toolbarExtra?: React.ReactNode
}

function headerAlign(align?: ColumnAlign) {
  if (align === 'right') return 'right'
  if (align === 'center') return 'center'
  return 'left'
}

const MIN_TEXT_COLUMN_FILTER_LENGTH = 3
const COLUMN_FILTER_DEBOUNCE_MS = 400

type ColumnTextFilterProps = {
  filterKey: string
  appliedValue: string
  onApply: (key: string, value: string) => void
}

function ColumnTextFilter({ filterKey, appliedValue, onApply }: ColumnTextFilterProps) {
  const [draft, setDraft] = useState(appliedValue)
  const [debouncedDraft] = useDebouncedValue(draft, COLUMN_FILTER_DEBOUNCE_MS)

  useEffect(() => {
    setDraft(appliedValue)
  }, [appliedValue])

  useEffect(() => {
    const trimmed = debouncedDraft.trim()
    if (trimmed.length === 0) {
      if (appliedValue) onApply(filterKey, '')
      return
    }
    if (trimmed.length >= MIN_TEXT_COLUMN_FILTER_LENGTH) {
      if (trimmed !== appliedValue) onApply(filterKey, trimmed)
      return
    }
    if (appliedValue) onApply(filterKey, '')
  }, [debouncedDraft, filterKey, appliedValue, onApply])

  return (
    <TextInput
      size="xs"
      placeholder={`Mín. ${MIN_TEXT_COLUMN_FILTER_LENGTH} caracteres`}
      value={draft}
      onChange={(e) => setDraft(e.currentTarget.value)}
    />
  )
}

function defaultRowId<T>(row: T): string {
  if (row && typeof row === 'object' && 'id' in row && typeof (row as { id: unknown }).id === 'string') {
    return (row as { id: string }).id
  }
  return ''
}

export function DataTableView<T>({
  columns,
  data,
  listState,
  onToggleSort,
  onColumnFilter,
  onClearColumnFilters,
  onSearchChange,
  onPageChange,
  onPageSizeChange,
  searchPlaceholder,
  getRowId = defaultRowId,
  toolbarExtra,
}: Props<T>) {
  const [showColumnFilters, setShowColumnFilters] = useState(false)
  const rows = data?.items ?? []
  const activeColumnFilterCount = visibleColumnFilterCount(listState.columnFilters)
  const hasActiveFilters =
    activeColumnFilterCount > 0 || listState.search.trim().length > 0

  const stickyKeys = useMemo(() => {
    const first = columns[0]?.key
    const last = columns[columns.length - 1]?.key
    return { first, last: last === 'actions' ? last : undefined }
  }, [columns])

  const removeColumnFilter = (key: string) => onColumnFilter(key, '')

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
        onRemoveColumnFilter={removeColumnFilter}
        searchPlaceholder={searchPlaceholder}
        showColumnFilters={showColumnFilters}
        onToggleColumnFilters={() => setShowColumnFilters((v) => !v)}
        activeColumnFilterCount={activeColumnFilterCount}
        extra={toolbarExtra}
      />

      <Paper withBorder radius="md" className="data-table-shell">
        <ScrollArea type="auto" offsetScrollbars>
          <Table
            striped
            highlightOnHover
            withTableBorder={false}
            withColumnBorders
            className="entity-data-table"
            miw={720}
          >
            <Table.Thead className="entity-data-table-head">
              <Table.Tr>
                {columns.map((col) => {
                  const sortKey = col.sortKey ?? col.key
                  const sortable = col.sortKey !== undefined
                  const active = listState.sortBy === sortKey
                  const align = headerAlign(col.align)
                  const isStickyFirst = col.key === stickyKeys.first
                  const isStickyLast = col.key === stickyKeys.last
                  return (
                    <Table.Th
                      key={col.key}
                      ta={align}
                      className={
                        isStickyFirst
                          ? 'data-table-sticky-start'
                          : isStickyLast
                            ? 'data-table-sticky-end'
                            : undefined
                      }
                      style={{ minWidth: col.width }}
                    >
                      {sortable ? (
                        <SortHeader
                          label={col.header}
                          active={active}
                          dir={listState.sortDir}
                          onClick={() => onToggleSort(sortKey)}
                        />
                      ) : (
                        <Text size="xs" fw={600}>
                          {col.header}
                        </Text>
                      )}
                    </Table.Th>
                  )
                })}
              </Table.Tr>
              {showColumnFilters && (
                <Table.Tr>
                  {columns.map((col) => {
                    const filterKey = col.filterKey ?? col.key
                    if (col.filter === 'none' || !col.filter) {
                      return <Table.Th key={`${col.key}-filter`} />
                    }
                    if (col.filter === 'select' && col.filterOptions) {
                      return (
                        <Table.Th key={`${col.key}-filter`}>
                          <Select
                            size="xs"
                            placeholder="Todos"
                            clearable
                            data={col.filterOptions}
                            value={listState.columnFilters[filterKey] ?? null}
                            onChange={(v) =>
                              onColumnFilter(filterKey, v != null && v !== '' ? String(v) : '')
                            }
                          />
                        </Table.Th>
                      )
                    }
                    return (
                      <Table.Th key={`${col.key}-filter`}>
                        <ColumnTextFilter
                          filterKey={filterKey}
                          appliedValue={listState.columnFilters[filterKey] ?? ''}
                          onApply={onColumnFilter}
                        />
                      </Table.Th>
                    )
                  })}
                </Table.Tr>
              )}
            </Table.Thead>
            <Table.Tbody>
              {rows.length === 0 ? (
                <Table.Tr>
                  <Table.Td colSpan={columns.length}>
                    <Center py="xl">
                      <Stack gap="sm" align="center">
                        <Text size="sm" c="dimmed" ta="center">
                          Ningún registro coincide con los filtros.
                        </Text>
                        {hasActiveFilters && onClearColumnFilters && (
                          <Button
                            variant="light"
                            leftSection={<IconFilterOff size={16} />}
                            onClick={() => {
                              onClearColumnFilters()
                              onSearchChange('')
                            }}
                          >
                            Limpiar filtros
                          </Button>
                        )}
                      </Stack>
                    </Center>
                  </Table.Td>
                </Table.Tr>
              ) : (
                rows.map((row, index) => {
                  const id = getRowId(row) || String(index)
                  return (
                    <Table.Tr key={id}>
                      {columns.map((col) => {
                        const isStickyFirst = col.key === stickyKeys.first
                        const isStickyLast = col.key === stickyKeys.last
                        return (
                          <Table.Td
                            key={col.key}
                            ta={headerAlign(col.align)}
                            className={
                              isStickyFirst
                                ? 'data-table-sticky-start'
                                : isStickyLast
                                  ? 'data-table-sticky-end'
                                  : undefined
                            }
                          >
                            {col.render(row)}
                          </Table.Td>
                        )
                      })}
                    </Table.Tr>
                  )
                })
              )}
            </Table.Tbody>
          </Table>
        </ScrollArea>
      </Paper>
    </Stack>
  )
}
