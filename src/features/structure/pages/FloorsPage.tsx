import {
  ActionIcon,
  Button,
  Group,
  NumberInput,
  Select,
  Stack,
  Switch,
  Text,
  TextInput,
} from '@mantine/core'
import { useForm } from '@mantine/form'
import { notifications } from '@mantine/notifications'
import { useMutation } from '@tanstack/react-query'
import { useEffect, useMemo, useState } from 'react'
import { api } from '../../../api/client'
import { getApiErrorMessage } from '../../../api/errors'
import type { Building, Floor } from '../../../api/types'
import { EntityCard } from '../../../components/crud/EntityCard'
import { FormDrawer } from '../../../components/crud/FormDrawer'
import { ListToolbar } from '../../../components/crud/ListToolbar'
import { PagedEntityView } from '../../../components/data-table/PagedEntityView'
import { activeColumn } from '../../../components/data-table/tableColumns'
import type { ColumnDef } from '../../../components/data-table/types'
import { PageHeader } from '../../../components/shared/PageHeader'
import { useEntityOptions } from '../../../hooks/useEntityOptions'
import { useInvalidate } from '../../../hooks/useInvalidate'
import { usePagedListQuery } from '../../../hooks/usePagedListQuery'
import { usePagedListState } from '../../../hooks/usePagedListState'
import { usePropertyId } from '../../../hooks/usePropertyId'
import { formDrawerSelectComboboxProps } from '../../../lib/formDrawerSelect'

export function FloorsPage() {
  const propertyId = usePropertyId()
  const [drawer, setDrawer] = useState<'create' | Floor | null>(null)
  const invalidate = useInvalidate(['floors', 'floor-options'])
  const list = usePagedListState('sortorder', {
    columnFilters: { horizontalPropertyId: propertyId },
  })
  const listQuery = usePagedListQuery<Floor>('floors', '/api/Floors', list)
  const buildings = useEntityOptions<Building>('building-options', '/api/Buildings', {
    horizontalPropertyId: propertyId,
  })

  useEffect(() => {
    list.setFilter('horizontalPropertyId', propertyId)
  }, [propertyId, list.setFilter])

  const form = useForm({
    initialValues: {
      buildingId: '',
      name: '',
      number: null as number | null,
      sortOrder: 0,
      isActive: true,
    },
    validate: {
      buildingId: (v) => (!v ? 'Obligatorio' : null),
      name: (v) => (v.trim().length < 1 ? 'Obligatorio' : null),
    },
  })

  const buildingOptions = useMemo(
    () => (buildings.data ?? []).map((b) => ({ value: b.id, label: b.name })),
    [buildings.data],
  )

  const buildingNameById = useMemo(() => {
    const map = new Map<string, string>()
    for (const b of buildings.data ?? []) map.set(b.id, b.name)
    return map
  }, [buildings.data])

  const openCreate = () => {
    form.setValues({
      buildingId: buildingOptions[0]?.value ?? '',
      name: '',
      number: null,
      sortOrder: 0,
      isActive: true,
    })
    setDrawer('create')
  }

  const openEdit = (item: Floor) => {
    form.setValues({
      buildingId: item.buildingId,
      name: item.name,
      number: item.number,
      sortOrder: item.sortOrder,
      isActive: item.isActive,
    })
    setDrawer(item)
  }

  const saveMutation = useMutation({
    mutationFn: async () => {
      const payload = {
        buildingId: form.values.buildingId,
        name: form.values.name.trim(),
        number: form.values.number,
        sortOrder: Number(form.values.sortOrder) || 0,
      }
      if (drawer === 'create') {
        const { data } = await api.post<Floor>('/api/Floors', payload)
        return data
      }
      const { data } = await api.put<Floor>(`/api/Floors/${drawer!.id}`, {
        ...payload,
        isActive: form.values.isActive,
      })
      return data
    },
    onSuccess: () => {
      notifications.show({ title: 'Guardado', message: 'Piso guardado', color: 'teal' })
      setDrawer(null)
      invalidate()
    },
    onError: (err) =>
      notifications.show({ title: 'Error', message: getApiErrorMessage(err), color: 'red' }),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/api/Floors/${id}`),
    onSuccess: () => {
      notifications.show({ title: 'Desactivado', message: 'Piso desactivado', color: 'gray' })
      invalidate()
    },
    onError: (err) =>
      notifications.show({ title: 'Error', message: getApiErrorMessage(err), color: 'red' }),
  })

  const columns = useMemo((): ColumnDef<Floor>[] => {
    return [
      {
        key: 'name',
        header: 'Nombre',
        sortKey: 'name',
        filter: 'text',
        filterKey: 'name',
        render: (row) => (
          <Text size="sm" fw={500}>
            {row.name}
          </Text>
        ),
      },
      {
        key: 'building',
        header: 'Bloque',
        filter: 'none',
        render: (row) => buildingNameById.get(row.buildingId) ?? '—',
      },
      {
        key: 'number',
        header: 'Número',
        sortKey: 'number',
        filter: 'none',
        render: (row) => row.number ?? '—',
      },
      activeColumn<Floor>(),
      {
        key: 'actions',
        header: '',
        filter: 'none',
        width: 88,
        render: (row) => (
          <Group gap={4} wrap="nowrap">
            <ActionIcon variant="light" size="md" onClick={() => openEdit(row)} aria-label="Editar">
              ✎
            </ActionIcon>
            <ActionIcon
              variant="light"
              color="red"
              size="md"
              onClick={() => {
                if (window.confirm(`¿Desactivar "${row.name}"?`)) deleteMutation.mutate(row.id)
              }}
              aria-label="Eliminar"
            >
              ✕
            </ActionIcon>
          </Group>
        ),
      },
    ]
  }, [buildingNameById, deleteMutation])

  return (
    <Stack gap="md">
      <PageHeader title="Pisos" description="Niveles dentro de los bloques de esta propiedad." />
      <ListToolbar
        onAdd={openCreate}
        addLabel="Agregar piso"
        includeInactive={list.state.includeInactive}
        onIncludeInactiveChange={list.setIncludeInactive}
      />
      <PagedEntityView
        loading={listQuery.isLoading}
        data={listQuery.data}
        columns={columns}
        listState={list.state}
        onToggleSort={list.toggleSort}
        onColumnFilter={list.setColumnFilter}
        onClearColumnFilters={() => {
          list.clearColumnFilters()
          list.setFilter('horizontalPropertyId', propertyId)
        }}
        onSearchChange={list.setSearch}
        onPageChange={list.setPage}
        onPageSizeChange={list.setPageSize}
        renderCard={(item) => (
          <EntityCard
            key={item.id}
            title={item.name}
            subtitle={buildingNameById.get(item.buildingId)}
            inactive={!item.isActive}
            onEdit={() => openEdit(item)}
            onDelete={() => {
              if (window.confirm(`¿Desactivar "${item.name}"?`)) deleteMutation.mutate(item.id)
            }}
          />
        )}
      />

      <FormDrawer
        opened={drawer !== null}
        onClose={() => setDrawer(null)}
        title={drawer === 'create' ? 'Nuevo piso' : 'Editar piso'}
      >
        <form onSubmit={form.onSubmit(() => saveMutation.mutate())}>
          <Stack gap="sm">
            <Select
              label="Bloque"
              required
              data={buildingOptions}
              comboboxProps={formDrawerSelectComboboxProps}
              {...form.getInputProps('buildingId')}
            />
            <TextInput label="Nombre" required {...form.getInputProps('name')} />
            <NumberInput
              label="Número de piso"
              value={form.values.number ?? ''}
              onChange={(v) => form.setFieldValue('number', typeof v === 'number' ? v : null)}
            />
            <NumberInput label="Orden" {...form.getInputProps('sortOrder')} />
            {drawer !== 'create' && (
              <Switch label="Activo" {...form.getInputProps('isActive', { type: 'checkbox' })} />
            )}
            <Button type="submit" fullWidth loading={saveMutation.isPending}>
              Guardar
            </Button>
          </Stack>
        </form>
      </FormDrawer>
    </Stack>
  )
}
