import { ActionIcon, Button, Group, NumberInput, Stack, Switch, Text, TextInput } from '@mantine/core'
import { useForm } from '@mantine/form'
import { notifications } from '@mantine/notifications'
import { useMutation } from '@tanstack/react-query'
import { useEffect, useMemo, useState } from 'react'
import { api } from '../../../api/client'
import { getApiErrorMessage } from '../../../api/errors'
import type { Building } from '../../../api/types'
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
import { usePropertyId } from '../../../hooks/usePropertyId'

export function BuildingsPage() {
  const propertyId = usePropertyId()
  const [drawer, setDrawer] = useState<'create' | Building | null>(null)
  const invalidate = useInvalidate(['buildings', 'building-options'])
  const list = usePagedListState('sortorder', {
    columnFilters: { horizontalPropertyId: propertyId },
  })
  const listQuery = usePagedListQuery<Building>('buildings', '/api/Buildings', list)

  useEffect(() => {
    list.setFilter('horizontalPropertyId', propertyId)
  }, [propertyId, list.setFilter])

  const form = useForm({
    initialValues: { name: '', code: '', sortOrder: 0, isActive: true },
    validate: { name: (v) => (v.trim().length < 1 ? 'Obligatorio' : null) },
  })

  const openCreate = () => {
    form.setValues({ name: '', code: '', sortOrder: 0, isActive: true })
    setDrawer('create')
  }

  const openEdit = (item: Building) => {
    form.setValues({
      name: item.name,
      code: item.code ?? '',
      sortOrder: item.sortOrder,
      isActive: item.isActive,
    })
    setDrawer(item)
  }

  const saveMutation = useMutation({
    mutationFn: async () => {
      const payload = {
        horizontalPropertyId: propertyId,
        name: form.values.name.trim(),
        code: form.values.code.trim() || null,
        sortOrder: Number(form.values.sortOrder) || 0,
      }
      if (drawer === 'create') {
        const { data } = await api.post<Building>('/api/Buildings', payload)
        return data
      }
      const { data } = await api.put<Building>(`/api/Buildings/${drawer!.id}`, {
        ...payload,
        isActive: form.values.isActive,
      })
      return data
    },
    onSuccess: () => {
      notifications.show({ title: 'Guardado', message: 'Bloque guardado', color: 'teal' })
      setDrawer(null)
      invalidate()
    },
    onError: (err) =>
      notifications.show({ title: 'Error', message: getApiErrorMessage(err), color: 'red' }),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/api/Buildings/${id}`),
    onSuccess: () => {
      notifications.show({ title: 'Desactivado', message: 'Bloque desactivado', color: 'gray' })
      invalidate()
    },
    onError: (err) =>
      notifications.show({ title: 'Error', message: getApiErrorMessage(err), color: 'red' }),
  })

  const columns = useMemo((): ColumnDef<Building>[] => {
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
        key: 'code',
        header: 'Código',
        sortKey: 'code',
        filter: 'text',
        filterKey: 'code',
        render: (row) => row.code ?? '—',
      },
      {
        key: 'sortOrder',
        header: 'Orden',
        sortKey: 'sortorder',
        filter: 'none',
        render: (row) => row.sortOrder,
      },
      activeColumn<Building>(),
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
  }, [deleteMutation])

  return (
    <Stack gap="md">
      <PageHeader title="Bloques" description="Torres o bloques dentro de esta propiedad." />
      <ListToolbar
        onAdd={openCreate}
        addLabel="Agregar bloque"
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
            subtitle={item.code ?? undefined}
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
        title={drawer === 'create' ? 'Nuevo bloque' : 'Editar bloque'}
      >
        <form onSubmit={form.onSubmit(() => saveMutation.mutate())}>
          <Stack gap="sm">
            <TextInput label="Nombre" required {...form.getInputProps('name')} />
            <TextInput label="Código" {...form.getInputProps('code')} />
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
