import {
  ActionIcon,
  Button,
  Group,
  NumberInput,
  Select,
  Stack,
  Switch,
  Textarea,
  TextInput,
  Tooltip,
} from '@mantine/core'
import { useForm } from '@mantine/form'
import { notifications } from '@mantine/notifications'
import { useMutation } from '@tanstack/react-query'
import { useEffect, useMemo, useState } from 'react'
import { api } from '../../../api/client'
import { getApiErrorMessage } from '../../../api/errors'
import type { CommonArea, Person, Reservation, Unit } from '../../../api/types'
import { EntityCard } from '../../../components/crud/EntityCard'
import { FormDrawer } from '../../../components/crud/FormDrawer'
import { ListToolbar } from '../../../components/crud/ListToolbar'
import { PagedEntityView } from '../../../components/data-table/PagedEntityView'
import { activeColumn } from '../../../components/data-table/tableColumns'
import type { ColumnDef } from '../../../components/data-table/types'
import { PageHeader } from '../../../components/shared/PageHeader'
import { StatusBadge } from '../../../components/shared/StatusBadge'
import { useEntityOptions } from '../../../hooks/useEntityOptions'
import { useInvalidate } from '../../../hooks/useInvalidate'
import { usePagedListQuery } from '../../../hooks/usePagedListQuery'
import { usePagedListState } from '../../../hooks/usePagedListState'
import { usePropertyId } from '../../../hooks/usePropertyId'
import {
  asEnumName,
  enumIndex,
  labelForOption,
  reservationStatusActions,
  reservationStatusVariant,
  RESERVATION_STATUS_OPTIONS,
} from '../../../lib/amenitiesEnums'
import { localInputToUtcIso, utcIsoToLocalInput } from '../../../lib/datetime'
import { formDrawerSelectComboboxProps } from '../../../lib/formDrawerSelect'

function personLabel(p: Person) {
  return `${p.firstName} ${p.lastName} (${p.documentNumber})`
}

export function ReservationsPage() {
  const propertyId = usePropertyId()
  const [drawer, setDrawer] = useState<'create' | Reservation | null>(null)
  const invalidate = useInvalidate(['reservations', 'common-area-options'])
  const list = usePagedListState('startsatutc', {
    sortDir: 'desc',
    columnFilters: { horizontalPropertyId: propertyId },
  })
  const listQuery = usePagedListQuery<Reservation>('reservations', '/api/Reservations', list)

  useEffect(() => {
    list.setFilter('horizontalPropertyId', propertyId)
  }, [propertyId, list.setFilter])

  const areas = useEntityOptions<CommonArea>('common-area-options', '/api/CommonAreas', {
    horizontalPropertyId: propertyId,
  })
  const units = useEntityOptions<Unit>('unit-options', '/api/Units', {
    horizontalPropertyId: propertyId,
  })
  const people = useEntityOptions<Person>('people-options', '/api/People')

  const areaOptions = useMemo(
    () => (areas.data ?? []).map((a) => ({ value: a.id, label: a.name })),
    [areas.data],
  )
  const unitOptions = useMemo(
    () => (units.data ?? []).map((u) => ({ value: u.id, label: u.code })),
    [units.data],
  )
  const personOptions = useMemo(
    () => (people.data ?? []).map((p) => ({ value: p.id, label: personLabel(p) })),
    [people.data],
  )

  const form = useForm({
    initialValues: {
      commonAreaId: '',
      unitId: '',
      personId: '' as string | null,
      startsAt: utcIsoToLocalInput(new Date().toISOString()),
      endsAt: utcIsoToLocalInput(new Date(Date.now() + 60 * 60 * 1000).toISOString()),
      attendeesCount: 1,
      notes: '',
      depositPaid: false,
      status: 'Pending',
      isActive: true,
    },
    validate: {
      commonAreaId: (v) => (!v ? 'Required' : null),
      unitId: (v) => (!v ? 'Required' : null),
      startsAt: (v) => (!v ? 'Required' : null),
      endsAt: (v, values) => {
        if (!v) return 'Required'
        if (values.startsAt && new Date(v) <= new Date(values.startsAt)) {
          return 'End must be after start'
        }
        return null
      },
      attendeesCount: (v) => (v < 1 ? 'Must be at least 1' : null),
    },
  })

  const openCreate = () => {
    form.setValues({
      commonAreaId: areaOptions[0]?.value ?? '',
      unitId: unitOptions[0]?.value ?? '',
      personId: null,
      startsAt: utcIsoToLocalInput(new Date().toISOString()),
      endsAt: utcIsoToLocalInput(new Date(Date.now() + 60 * 60 * 1000).toISOString()),
      attendeesCount: 1,
      notes: '',
      depositPaid: false,
      status: 'Pending',
      isActive: true,
    })
    setDrawer('create')
  }

  const openEdit = (item: Reservation) => {
    form.setValues({
      commonAreaId: item.commonAreaId,
      unitId: item.unitId,
      personId: item.personId,
      startsAt: utcIsoToLocalInput(item.startsAtUtc),
      endsAt: utcIsoToLocalInput(item.endsAtUtc),
      attendeesCount: item.attendeesCount,
      notes: item.notes ?? '',
      depositPaid: item.depositPaid,
      status: asEnumName(item.status, RESERVATION_STATUS_OPTIONS) || 'Pending',
      isActive: item.isActive,
    })
    setDrawer(item)
  }

  const saveMutation = useMutation({
    mutationFn: async () => {
      const payload = {
        horizontalPropertyId: propertyId,
        commonAreaId: form.values.commonAreaId,
        unitId: form.values.unitId,
        personId: form.values.personId || null,
        startsAtUtc: localInputToUtcIso(form.values.startsAt),
        endsAtUtc: localInputToUtcIso(form.values.endsAt),
        attendeesCount: Number(form.values.attendeesCount) || 1,
        notes: form.values.notes.trim() || null,
        depositPaid: form.values.depositPaid,
      }
      if (drawer === 'create') {
        const { data } = await api.post<Reservation>('/api/Reservations', payload)
        return data
      }
      const { data } = await api.put<Reservation>(`/api/Reservations/${drawer!.id}`, {
        ...payload,
        status: enumIndex(form.values.status, RESERVATION_STATUS_OPTIONS),
        isActive: form.values.isActive,
      })
      return data
    },
    onSuccess: () => {
      notifications.show({ title: 'Saved', message: 'Reservation saved', color: 'teal' })
      setDrawer(null)
      invalidate()
    },
    onError: (err) =>
      notifications.show({ title: 'Error', message: getApiErrorMessage(err), color: 'red' }),
  })

  const statusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { data } = await api.post<Reservation>(`/api/Reservations/${id}/status`, {
        status: enumIndex(status, RESERVATION_STATUS_OPTIONS),
      })
      return data
    },
    onSuccess: (_data, vars) => {
      notifications.show({
        title: 'Updated',
        message: `Reservation marked as ${labelForOption(RESERVATION_STATUS_OPTIONS, vars.status)}`,
        color: 'teal',
      })
      invalidate()
    },
    onError: (err) =>
      notifications.show({ title: 'Error', message: getApiErrorMessage(err), color: 'red' }),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/api/Reservations/${id}`),
    onSuccess: () => {
      notifications.show({ title: 'Deactivated', message: 'Reservation deactivated', color: 'gray' })
      invalidate()
    },
    onError: (err) =>
      notifications.show({ title: 'Error', message: getApiErrorMessage(err), color: 'red' }),
  })

  const columns = useMemo((): ColumnDef<Reservation>[] => {
    return [
      {
        key: 'area',
        header: 'Area',
        sortKey: 'commonareaid',
        filter: 'select',
        filterKey: 'commonAreaId',
        filterOptions: areaOptions,
        render: (row) =>
          row.commonAreaName ??
          areaOptions.find((a) => a.value === row.commonAreaId)?.label ??
          '—',
      },
      {
        key: 'unit',
        header: 'Unit',
        sortKey: 'unitid',
        filter: 'select',
        filterKey: 'unitId',
        filterOptions: unitOptions,
        render: (row) => row.unitCode ?? unitOptions.find((u) => u.value === row.unitId)?.label ?? '—',
      },
      {
        key: 'startsAt',
        header: 'Start',
        sortKey: 'startsatutc',
        filter: 'none',
        render: (row) => new Date(row.startsAtUtc).toLocaleString(),
      },
      {
        key: 'endsAt',
        header: 'End',
        sortKey: 'endsatutc',
        filter: 'none',
        render: (row) => new Date(row.endsAtUtc).toLocaleString(),
      },
      {
        key: 'status',
        header: 'Status',
        sortKey: 'status',
        filter: 'select',
        filterKey: 'status',
        filterOptions: RESERVATION_STATUS_OPTIONS.map((o) => ({ value: o.value, label: o.label })),
        render: (row) => (
          <StatusBadge
            variant={reservationStatusVariant(row.status)}
            label={labelForOption(RESERVATION_STATUS_OPTIONS, row.status)}
          />
        ),
      },
      {
        key: 'attendees',
        header: 'Attendees',
        sortKey: 'attendeescount',
        filter: 'none',
        render: (row) => row.attendeesCount,
      },
      activeColumn<Reservation>(),
      {
        key: 'actions',
        header: '',
        filter: 'none',
        width: 220,
        render: (row) => {
          const actions = reservationStatusActions(row.status)
          return (
            <Group gap={4} wrap="nowrap">
              {actions.map((action) => (
                <Tooltip key={action.status} label={action.label}>
                  <Button
                    size="compact-xs"
                    variant="light"
                    color={action.color}
                    loading={statusMutation.isPending}
                    onClick={() => {
                      if (
                        window.confirm(
                          `Mark reservation as ${action.label.toLowerCase()}?`,
                        )
                      ) {
                        statusMutation.mutate({ id: row.id, status: action.status })
                      }
                    }}
                  >
                    {action.label}
                  </Button>
                </Tooltip>
              ))}
              <ActionIcon variant="light" size="md" onClick={() => openEdit(row)} aria-label="Edit">
                ✎
              </ActionIcon>
              <ActionIcon
                variant="light"
                color="red"
                size="md"
                onClick={() => {
                  if (window.confirm('Deactivate this reservation?')) deleteMutation.mutate(row.id)
                }}
                aria-label="Delete"
              >
                ✕
              </ActionIcon>
            </Group>
          )
        },
      },
    ]
  }, [areaOptions, deleteMutation, statusMutation, unitOptions])

  return (
    <Stack gap="md">
      <PageHeader
        title="Reservations"
        description="Book common areas for residents. Overlaps with pending or confirmed bookings are rejected."
      />
      <ListToolbar
        onAdd={openCreate}
        addLabel="Add reservation"
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
            title={
              item.commonAreaName ??
              areaOptions.find((a) => a.value === item.commonAreaId)?.label ??
              'Reservation'
            }
            subtitle={`${item.unitCode ?? unitOptions.find((u) => u.value === item.unitId)?.label ?? '—'} · ${labelForOption(RESERVATION_STATUS_OPTIONS, item.status)}`}
            inactive={!item.isActive}
            onEdit={() => openEdit(item)}
            onDelete={() => {
              if (window.confirm('Deactivate this reservation?')) deleteMutation.mutate(item.id)
            }}
          />
        )}
      />

      <FormDrawer
        opened={drawer !== null}
        onClose={() => setDrawer(null)}
        title={drawer === 'create' ? 'New reservation' : 'Edit reservation'}
      >
        <form onSubmit={form.onSubmit(() => saveMutation.mutate())}>
          <Stack gap="sm">
            <Select
              label="Common area"
              required
              data={areaOptions}
              searchable
              comboboxProps={formDrawerSelectComboboxProps}
              {...form.getInputProps('commonAreaId')}
            />
            <Select
              label="Unit"
              required
              data={unitOptions}
              searchable
              comboboxProps={formDrawerSelectComboboxProps}
              {...form.getInputProps('unitId')}
            />
            <Select
              label="Person (optional)"
              data={personOptions}
              searchable
              clearable
              comboboxProps={formDrawerSelectComboboxProps}
              value={form.values.personId || null}
              onChange={(v) => form.setFieldValue('personId', v)}
            />
            <TextInput
              label="Starts at"
              type="datetime-local"
              required
              {...form.getInputProps('startsAt')}
            />
            <TextInput
              label="Ends at"
              type="datetime-local"
              required
              {...form.getInputProps('endsAt')}
            />
            <NumberInput
              label="Attendees"
              required
              min={1}
              allowDecimal={false}
              {...form.getInputProps('attendeesCount')}
            />
            <Switch
              label="Deposit paid"
              {...form.getInputProps('depositPaid', { type: 'checkbox' })}
            />
            {drawer !== 'create' ? (
              <Select
                label="Status"
                data={[...RESERVATION_STATUS_OPTIONS]}
                comboboxProps={formDrawerSelectComboboxProps}
                {...form.getInputProps('status')}
              />
            ) : null}
            <Textarea label="Notes" minRows={2} {...form.getInputProps('notes')} />
            {drawer !== 'create' ? (
              <Switch label="Active" {...form.getInputProps('isActive', { type: 'checkbox' })} />
            ) : null}
            <Button type="submit" fullWidth loading={saveMutation.isPending}>
              Save
            </Button>
          </Stack>
        </form>
      </FormDrawer>
    </Stack>
  )
}
