import {
  ActionIcon,
  Button,
  Group,
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
import type { Person, Unit, UnitOccupancy } from '../../../api/types'
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
import { labelForOption, OCCUPANCY_ROLE_OPTIONS } from '../../../lib/structureEnums'

function personLabel(p: Person) {
  return `${p.firstName} ${p.lastName} (${p.documentNumber})`
}

export function OccupanciesPage() {
  const propertyId = usePropertyId()
  const [drawer, setDrawer] = useState<'create' | UnitOccupancy | null>(null)
  const invalidate = useInvalidate(['unit-occupancies'])
  const list = usePagedListState('startdate', {
    columnFilters: { horizontalPropertyId: propertyId },
    sortDir: 'desc',
  })
  const listQuery = usePagedListQuery<UnitOccupancy>(
    'unit-occupancies',
    '/api/UnitOccupancies',
    list,
  )

  useEffect(() => {
    list.setFilter('horizontalPropertyId', propertyId)
  }, [propertyId, list.setFilter])

  const units = useEntityOptions<Unit>('unit-options', '/api/Units', {
    horizontalPropertyId: propertyId,
  })
  const people = useEntityOptions<Person>('people-options', '/api/People')

  const form = useForm({
    initialValues: {
      unitId: '',
      personId: '',
      role: 'Owner',
      isPrimary: true,
      receivesBilling: true,
      startDate: '',
      endDate: '',
      isActive: true,
    },
    validate: {
      unitId: (v) => (!v ? 'Required' : null),
      personId: (v) => (!v ? 'Required' : null),
      role: (v) => (!v ? 'Required' : null),
      startDate: (v) => (!v ? 'Required' : null),
    },
  })

  const unitOptions = useMemo(
    () => (units.data ?? []).map((u) => ({ value: u.id, label: u.code })),
    [units.data],
  )
  const personOptions = useMemo(
    () => (people.data ?? []).map((p) => ({ value: p.id, label: personLabel(p) })),
    [people.data],
  )

  const unitCodeById = useMemo(() => {
    const map = new Map<string, string>()
    for (const u of units.data ?? []) map.set(u.id, u.code)
    return map
  }, [units.data])

  const personNameById = useMemo(() => {
    const map = new Map<string, string>()
    for (const p of people.data ?? []) map.set(p.id, `${p.firstName} ${p.lastName}`)
    return map
  }, [people.data])

  const openCreate = () => {
    form.setValues({
      unitId: unitOptions[0]?.value ?? '',
      personId: '',
      role: 'Owner',
      isPrimary: true,
      receivesBilling: true,
      startDate: new Date().toISOString().slice(0, 10),
      endDate: '',
      isActive: true,
    })
    setDrawer('create')
  }

  const openEdit = (item: UnitOccupancy) => {
    form.setValues({
      unitId: item.unitId,
      personId: item.personId,
      role: item.role,
      isPrimary: item.isPrimary,
      receivesBilling: item.receivesBilling,
      startDate: item.startDate?.slice(0, 10) ?? '',
      endDate: item.endDate?.slice(0, 10) ?? '',
      isActive: item.isActive,
    })
    setDrawer(item)
  }

  const saveMutation = useMutation({
    mutationFn: async () => {
      const payload = {
        unitId: form.values.unitId,
        personId: form.values.personId,
        role: form.values.role,
        isPrimary: form.values.isPrimary,
        receivesBilling: form.values.receivesBilling,
        startDate: form.values.startDate,
        endDate: form.values.endDate.trim() || null,
      }
      if (drawer === 'create') {
        const { data } = await api.post<UnitOccupancy>('/api/UnitOccupancies', payload)
        return data
      }
      const { data } = await api.put<UnitOccupancy>(`/api/UnitOccupancies/${drawer!.id}`, {
        ...payload,
        isActive: form.values.isActive,
      })
      return data
    },
    onSuccess: () => {
      notifications.show({ title: 'Saved', message: 'Occupancy saved', color: 'teal' })
      setDrawer(null)
      invalidate()
    },
    onError: (err) =>
      notifications.show({ title: 'Error', message: getApiErrorMessage(err), color: 'red' }),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/api/UnitOccupancies/${id}`),
    onSuccess: () => {
      notifications.show({ title: 'Deactivated', message: 'Occupancy deactivated', color: 'gray' })
      invalidate()
    },
    onError: (err) =>
      notifications.show({ title: 'Error', message: getApiErrorMessage(err), color: 'red' }),
  })

  const columns = useMemo((): ColumnDef<UnitOccupancy>[] => {
    return [
      {
        key: 'unit',
        header: 'Unit',
        filter: 'none',
        render: (row) => (
          <Text size="sm" fw={500}>
            {row.unitCode ?? unitCodeById.get(row.unitId) ?? '—'}
          </Text>
        ),
      },
      {
        key: 'person',
        header: 'Person',
        filter: 'none',
        render: (row) => row.personName ?? personNameById.get(row.personId) ?? '—',
      },
      {
        key: 'role',
        header: 'Role',
        sortKey: 'role',
        filter: 'select',
        filterKey: 'role',
        filterOptions: OCCUPANCY_ROLE_OPTIONS.map((o) => ({ value: o.value, label: o.label })),
        render: (row) => labelForOption(OCCUPANCY_ROLE_OPTIONS, row.role),
      },
      {
        key: 'startDate',
        header: 'Start',
        sortKey: 'startdate',
        filter: 'none',
        render: (row) => row.startDate?.slice(0, 10) ?? '—',
      },
      activeColumn<UnitOccupancy>(),
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
                const label = row.unitCode ?? unitCodeById.get(row.unitId) ?? 'occupancy'
                if (window.confirm(`Deactivate occupancy for "${label}"?`))
                  deleteMutation.mutate(row.id)
              }}
              aria-label="Delete"
            >
              ✕
            </ActionIcon>
          </Group>
        ),
      },
    ]
  }, [deleteMutation, personNameById, unitCodeById])

  return (
    <Stack gap="md">
      <PageHeader
        title="Occupancies"
        description="Link people to units as owners, tenants, or residents."
      />
      <ListToolbar
        onAdd={openCreate}
        addLabel="Add occupancy"
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
            title={item.unitCode ?? unitCodeById.get(item.unitId) ?? 'Unit'}
            subtitle={`${item.personName ?? personNameById.get(item.personId) ?? 'Person'} · ${labelForOption(OCCUPANCY_ROLE_OPTIONS, item.role)}`}
            inactive={!item.isActive}
            onEdit={() => openEdit(item)}
            onDelete={() => {
              const label = item.unitCode ?? unitCodeById.get(item.unitId) ?? 'occupancy'
              if (window.confirm(`Deactivate occupancy for "${label}"?`))
                deleteMutation.mutate(item.id)
            }}
          />
        )}
      />

      <FormDrawer
        opened={drawer !== null}
        onClose={() => setDrawer(null)}
        title={drawer === 'create' ? 'New occupancy' : 'Edit occupancy'}
      >
        <form onSubmit={form.onSubmit(() => saveMutation.mutate())}>
          <Stack gap="sm">
            <Select
              label="Unit"
              required
              searchable
              data={unitOptions}
              comboboxProps={formDrawerSelectComboboxProps}
              {...form.getInputProps('unitId')}
            />
            <Select
              label="Person"
              required
              searchable
              data={personOptions}
              comboboxProps={formDrawerSelectComboboxProps}
              {...form.getInputProps('personId')}
            />
            <Select
              label="Role"
              required
              data={[...OCCUPANCY_ROLE_OPTIONS]}
              comboboxProps={formDrawerSelectComboboxProps}
              {...form.getInputProps('role')}
            />
            <Switch label="Primary" {...form.getInputProps('isPrimary', { type: 'checkbox' })} />
            <Switch
              label="Receives billing"
              {...form.getInputProps('receivesBilling', { type: 'checkbox' })}
            />
            <TextInput label="Start date" type="date" required {...form.getInputProps('startDate')} />
            <TextInput label="End date" type="date" {...form.getInputProps('endDate')} />
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
