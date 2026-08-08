import { ActionIcon, Group, Text } from '@mantine/core'
import { IconEdit, IconFlask, IconTrash } from '@tabler/icons-react'
import { StatusBadge } from '../shared/StatusBadge'
import type { ColumnDef } from './types'

export function actionsColumn<T extends { id: string; name: string }>(
  onEdit: (row: T) => void,
  onDelete: (id: string, name: string) => void,
  options?: {
    onRecipe?: (row: T) => void
    showRecipe?: (row: T) => boolean
  },
): ColumnDef<T> {
  const showRecipeButton = (row: T) =>
    Boolean(options?.onRecipe) &&
    (options?.showRecipe === undefined || options.showRecipe(row))

  return {
    key: 'actions',
    header: '',
    filter: 'none',
    width: options?.onRecipe ? 132 : 100,
    align: 'center',
    render: (row) => (
      <Group gap={6} wrap="nowrap" justify="center">
        {showRecipeButton(row) ? (
          <ActionIcon
            variant="light"
            color="teal"
            onClick={() => options!.onRecipe!(row)}
            aria-label="Receta"
          >
            <IconFlask size={18} stroke={1.75} />
          </ActionIcon>
        ) : null}
        <ActionIcon variant="light" color="amber" onClick={() => onEdit(row)} aria-label="Editar">
          <IconEdit size={18} stroke={1.75} />
        </ActionIcon>
        <ActionIcon
          variant="light"
          color="red"
          onClick={() => onDelete(row.id, row.name)}
          aria-label="Eliminar"
        >
          <IconTrash size={18} stroke={1.75} />
        </ActionIcon>
      </Group>
    ),
  }
}

export function activeColumn<T extends { isActive: boolean }>(): ColumnDef<T> {
  return {
    key: 'active',
    header: 'Activo',
    sortKey: 'isactive',
    filter: 'select',
    filterKey: 'isActive',
    align: 'center',
    filterOptions: [
      { value: 'true', label: 'Activo' },
      { value: 'false', label: 'Inactivo' },
    ],
    render: (row) => (
      <StatusBadge variant={row.isActive ? 'active' : 'inactive'} />
    ),
  }
}

export function nameColumn<T extends { name: string }>(filterKey = 'name'): ColumnDef<T> {
  return {
    key: 'name',
    header: 'Nombre',
    sortKey: 'name',
    filter: 'text',
    filterKey,
    align: 'left',
    render: (row) => (
      <Text size="sm" fw={500}>
        {row.name}
      </Text>
    ),
  }
}

export function moneyColumn<T>(
  key: string,
  header: string,
  sortKey: string,
  filterKey: string,
  render: (row: T) => string,
): ColumnDef<T> {
  return {
    key,
    header,
    sortKey,
    filter: 'text',
    filterKey,
    align: 'right',
    render,
  }
}
