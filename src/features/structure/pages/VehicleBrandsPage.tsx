import { ActionIcon, Button, Group, Stack, Switch, Text, TextInput } from '@mantine/core'
import { useForm } from '@mantine/form'
import { notifications } from '@mantine/notifications'
import { useMutation } from '@tanstack/react-query'
import { useMemo, useState } from 'react'
import { api } from '../../../api/client'
import { getApiErrorMessage } from '../../../api/errors'
import type { VehicleBrand } from '../../../api/types'
import { EntityCard } from '../../../components/crud/EntityCard'
import { FormDrawer } from '../../../components/crud/FormDrawer'
import { ListToolbar } from '../../../components/crud/ListToolbar'
import { PagedEntityView } from '../../../components/data-table/PagedEntityView'
import { activeColumn } from '../../../components/data-table/tableColumns'
import type { ColumnDef } from '../../../components/data-table/types'
import { PageHeader } from '../../../components/shared/PageHeader'
import { useInvalidate } from '../../../hooks/useInvalidate'
import { usePagedListQuery } from '../../../hooks/usePagedListQuery'
import { usePagedListState } from '../../../hooks/usePagedListState'

export function VehicleBrandsPage() {
  const [drawer, setDrawer] = useState<'create' | VehicleBrand | null>(null)
  const invalidate = useInvalidate(['vehicle-brands', 'vehicle-brand-options'])
  const list = usePagedListState('name')
  const listQuery = usePagedListQuery<VehicleBrand>('vehicle-brands', '/api/VehicleBrands', list)

  const form = useForm({
    initialValues: { name: '', isActive: true },
    validate: {
      name: (v) => (v.trim().length < 1 ? 'Obligatorio' : null),
    },
  })

  const openCreate = () => {
    form.setValues({ name: '', isActive: true })
    setDrawer('create')
  }

  const openEdit = (item: VehicleBrand) => {
    form.setValues({ name: item.name, isActive: item.isActive })
    setDrawer(item)
  }

  const saveMutation = useMutation({
    mutationFn: async () => {
      const payload = { name: form.values.name.trim() }
      if (drawer === 'create') {
        const { data } = await api.post<VehicleBrand>('/api/VehicleBrands', payload)
        return data
      }
      const { data } = await api.put<VehicleBrand>(`/api/VehicleBrands/${drawer!.id}`, {
        ...payload,
        isActive: form.values.isActive,
      })
      return data
    },
    onSuccess: () => {
      notifications.show({ title: 'Guardado', message: 'Marca guardada', color: 'teal' })
      setDrawer(null)
      invalidate()
    },
    onError: (err) =>
      notifications.show({ title: 'Error', message: getApiErrorMessage(err), color: 'red' }),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/api/VehicleBrands/${id}`),
    onSuccess: () => {
      notifications.show({ title: 'Desactivado', message: 'Marca desactivada', color: 'gray' })
      invalidate()
    },
    onError: (err) =>
      notifications.show({ title: 'Error', message: getApiErrorMessage(err), color: 'red' }),
  })

  const columns = useMemo((): ColumnDef<VehicleBrand>[] => {
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
      activeColumn<VehicleBrand>(),
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
                if (window.confirm(`¿Desactivar la marca ${row.name}?`)) {
                  deleteMutation.mutate(row.id)
                }
              }}
              aria-label="Eliminar"
            >
              ✕
            </ActionIcon>
          </Group>
        ),
      },
    ]
  }, [deleteMutation])

  return (
    <Stack gap="md">
      <PageHeader
        title="Marcas de vehículos"
        description="Catálogo maestro de marcas (Chevrolet, Yamaha, etc.) para registrar carros y motos."
      />
      <ListToolbar
        onAdd={openCreate}
        addLabel="Agregar marca"
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
        onClearColumnFilters={list.clearColumnFilters}
        onSearchChange={list.setSearch}
        onPageChange={list.setPage}
        onPageSizeChange={list.setPageSize}
        renderCard={(item) => (
          <EntityCard
            key={item.id}
            title={item.name}
            inactive={!item.isActive}
            onEdit={() => openEdit(item)}
            onDelete={() => {
              if (window.confirm(`¿Desactivar la marca ${item.name}?`)) {
                deleteMutation.mutate(item.id)
              }
            }}
          />
        )}
      />

      <FormDrawer
        opened={drawer !== null}
        onClose={() => setDrawer(null)}
        title={drawer === 'create' ? 'Nueva marca' : 'Editar marca'}
      >
        <form onSubmit={form.onSubmit(() => saveMutation.mutate())}>
          <Stack gap="sm">
            <TextInput label="Nombre" required {...form.getInputProps('name')} />
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
