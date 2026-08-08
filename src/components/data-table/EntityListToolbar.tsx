import {
  ActionIcon,
  Badge,
  Button,
  Group,
  Pagination,
  Paper,
  Select,
  Stack,
  Text,
  TextInput,
} from '@mantine/core'
import { IconFilter, IconSearch, IconX } from '@tabler/icons-react'
import type { ReactNode } from 'react'
import type { ListQueryState, PagedResult } from '../../api/paging'
import { PAGE_SIZE_OPTIONS } from '../../api/paging'
import type { ColumnDef } from './types'

export type ActiveFilterChip = {
  key: string
  label: string
}

type Props = {
  listState: ListQueryState
  data: PagedResult<unknown> | undefined
  columns: ColumnDef<unknown>[]
  onSearchChange: (value: string) => void
  onPageChange: (page: number) => void
  onPageSizeChange: (size: number) => void
  onClearColumnFilters?: () => void
  onRemoveColumnFilter?: (key: string) => void
  searchPlaceholder?: string
  showColumnFilters?: boolean
  onToggleColumnFilters?: () => void
  activeColumnFilterCount?: number
  extra?: ReactNode
}

function buildFilterChips(
  columns: ColumnDef<unknown>[],
  columnFilters: Record<string, string>,
): ActiveFilterChip[] {
  return Object.entries(columnFilters).map(([key, value]) => {
    const col = columns.find((c) => (c.filterKey ?? c.key) === key)
    const header = col?.header ?? key
    const displayValue =
      col?.filter === 'select' && col.filterOptions
        ? (col.filterOptions.find((o) => o.value === value)?.label ?? value)
        : value
    return { key, label: `${header}: ${displayValue}` }
  })
}

export function EntityListToolbar({
  listState,
  data,
  columns,
  onSearchChange,
  onPageChange,
  onPageSizeChange,
  onClearColumnFilters,
  onRemoveColumnFilter,
  searchPlaceholder = 'Buscar…',
  showColumnFilters,
  onToggleColumnFilters,
  activeColumnFilterCount = 0,
  extra,
}: Props) {
  const totalPages = data?.totalPages ?? 0
  const chips = buildFilterChips(columns, listState.columnFilters)
  const filterableColumns = columns.some((c) => c.filter && c.filter !== 'none')

  return (
    <Stack gap="sm">
      <Paper withBorder p="sm" radius="md" className="entity-list-toolbar">
        <Group justify="space-between" align="flex-end" wrap="wrap" gap="md">
          <Group gap="sm" wrap="wrap" align="flex-end" style={{ flex: '1 1 280px' }}>
            <TextInput
              placeholder={searchPlaceholder}
              value={listState.search}
              onChange={(e) => onSearchChange(e.currentTarget.value)}
              leftSection={<IconSearch size={16} stroke={1.5} />}
              style={{ flex: '1 1 220px', minWidth: 200 }}
              aria-label="Buscar"
            />
            {filterableColumns && onToggleColumnFilters && (
              <Button
                variant={showColumnFilters ? 'filled' : 'light'}
                leftSection={<IconFilter size={16} />}
                onClick={onToggleColumnFilters}
                rightSection={
                  activeColumnFilterCount > 0 ? (
                    <Badge size="xs" variant="filled" circle>
                      {activeColumnFilterCount}
                    </Badge>
                  ) : undefined
                }
              >
                Filtros
              </Button>
            )}
            {extra}
          </Group>
          <Text size="sm" c="dimmed" fw={500} style={{ whiteSpace: 'nowrap' }}>
            {data
              ? `${data.totalCount} registro${data.totalCount === 1 ? '' : 's'}`
              : ' '}
          </Text>
        </Group>

        {chips.length > 0 && (
          <Group gap="xs" mt="sm" wrap="wrap">
            {chips.map((chip) => (
              <Badge
                key={chip.key}
                variant="light"
                color="amber"
                size="lg"
                rightSection={
                  onRemoveColumnFilter ? (
                    <ActionIcon
                      size="xs"
                      variant="transparent"
                      color="amber"
                      onClick={() => onRemoveColumnFilter(chip.key)}
                      aria-label={`Quitar filtro ${chip.label}`}
                    >
                      <IconX size={12} />
                    </ActionIcon>
                  ) : undefined
                }
              >
                {chip.label}
              </Badge>
            ))}
            {onClearColumnFilters && activeColumnFilterCount > 0 && (
              <Button variant="subtle" size="compact-sm" color="gray" onClick={onClearColumnFilters}>
                Limpiar filtros
              </Button>
            )}
          </Group>
        )}
      </Paper>

      <Group justify="space-between" align="center" wrap="wrap" gap="md">
        <Select
          label="Filas por página"
          data={PAGE_SIZE_OPTIONS.map((v) => ({ value: v, label: v }))}
          value={String(listState.pageSize)}
          onChange={(v) => onPageSizeChange(Number(v ?? listState.pageSize))}
          w={110}
          size="sm"
        />
        <Pagination
          value={listState.page}
          onChange={onPageChange}
          total={Math.max(1, totalPages)}
          size="md"
          withEdges
        />
      </Group>
    </Stack>
  )
}
