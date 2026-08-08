import { ActionIcon, Button, Group, Stack, Switch, Text, TextInput } from '@mantine/core'
import { useForm } from '@mantine/form'
import { notifications } from '@mantine/notifications'
import { useMutation } from '@tanstack/react-query'
import { useMemo, useState } from 'react'
import { api } from '../../../api/client'
import { getApiErrorMessage } from '../../../api/errors'
import type { Neighborhood } from '../../../api/types'
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

export function NeighborhoodsPage() {
  const [drawer, setDrawer] = useState<'create' | Neighborhood | null>(null)
  const invalidate = useInvalidate(['neighborhoods'])
  const list = usePagedListState('name')
  const listQuery = usePagedListQuery<Neighborhood>('neighborhoods', '/api/Neighborhoods', list)

  const form = useForm({
    initialValues: { name: '', city: '', country: 'Colombia', isActive: true },
    validate: {
      name: (v) => (v.trim().length < 1 ? 'Required' : null),
      country: (v) => (v.trim().length < 1 ? 'Required' : null),
    },
  })

  const openCreate = () => {
    form.setValues({ name: '', city: '', country: 'Colombia', isActive: true })
    setDrawer('create')
  }

  const openEdit = (item: Neighborhood) => {
    form.setValues({
      name: item.name,
      city: item.city ?? '',
      country: item.country,
      isActive: item.isActive,
    })
    setDrawer(item)
  }

  const saveMutation = useMutation({
    mutationFn: async () => {
      const payload = {
        name: form.values.name.trim(),
        city: form.values.city.trim() || null,
        country: form.values.country.trim(),
      }
      if (drawer === 'create') {
        const { data } = await api.post<Neighborhood>('/api/Neighborhoods', payload)
        return data
      }
      const { data } = await api.put<Neighborhood>(`/api/Neighborhoods/${drawer!.id}`, {
        ...payload,
        isActive: form.values.isActive,
      })
      return data
    },
    onSuccess: () => {
      notifications.show({ title: 'Saved', message: 'Neighborhood saved', color: 'teal' })
      setDrawer(null)
      invalidate()
    },
    onError: (err) =>
      notifications.show({ title: 'Error', message: getApiErrorMessage(err), color: 'red' }),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/api/Neighborhoods/${id}`),
    onSuccess: () => {
      notifications.show({ title: 'Deactivated', message: 'Neighborhood deactivated', color: 'gray' })
      invalidate()
    },
    onError: (err) =>
      notifications.show({ title: 'Error', message: getApiErrorMessage(err), color: 'red' }),
  })

  const columns = useMemo((): ColumnDef<Neighborhood>[] => {
    return [
      {
        key: 'name',
        header: 'Name',
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
        key: 'city',
        header: 'City',
        sortKey: 'city',
        filter: 'text',
        filterKey: 'city',
        render: (row) => row.city ?? '—',
      },
      {
        key: 'country',
        header: 'Country',
        sortKey: 'country',
        filter: 'text',
        filterKey: 'country',
        render: (row) => row.country,
      },
      activeColumn<Neighborhood>(),
      {
        key: 'actions',
        header: '',
        filter: 'none',
        width: 88,
        render: (row) => (
          <Group gap={4} wrap="nowrap">
            <ActionIcon variant="light" size="md" onClick={() => openEdit(row)} aria-label="Edit">
              ✎
            </ActionIcon>
            <ActionIcon
              variant="light"
              color="red"
              size="md"
              onClick={() => {
                if (window.confirm(`Deactivate "${row.name}"?`)) deleteMutation.mutate(row.id)
              }}
              aria-label="Delete"
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
        title="Neighborhoods"
        description="Geographic areas used to organize horizontal properties."
      />
      <ListToolbar
        onAdd={openCreate}
        addLabel="Add neighborhood"
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
            subtitle={[item.city, item.country].filter(Boolean).join(', ')}
            inactive={!item.isActive}
            onEdit={() => openEdit(item)}
            onDelete={() => {
              if (window.confirm(`Deactivate "${item.name}"?`)) deleteMutation.mutate(item.id)
            }}
          />
        )}
      />

      <FormDrawer
        opened={drawer !== null}
        onClose={() => setDrawer(null)}
        title={drawer === 'create' ? 'New neighborhood' : 'Edit neighborhood'}
      >
        <form onSubmit={form.onSubmit(() => saveMutation.mutate())}>
          <Stack gap="sm">
            <TextInput label="Name" required {...form.getInputProps('name')} />
            <TextInput label="City" {...form.getInputProps('city')} />
            <TextInput label="Country" required {...form.getInputProps('country')} />
            {drawer !== 'create' && (
              <Switch label="Active" {...form.getInputProps('isActive', { type: 'checkbox' })} />
            )}
            <Button type="submit" fullWidth loading={saveMutation.isPending}>
              Save
            </Button>
          </Stack>
        </form>
      </FormDrawer>
    </Stack>
  )
}
