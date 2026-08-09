import {
  ActionIcon,
  Alert,
  Badge,
  Button,
  Group,
  Select,
  Stack,
  Switch,
  Text,
  Textarea,
  TextInput,
  Tooltip,
} from '@mantine/core'
import { useForm } from '@mantine/form'
import { notifications } from '@mantine/notifications'
import { IconPackage } from '@tabler/icons-react'
import { useMutation, useQuery } from '@tanstack/react-query'
import { useEffect, useMemo, useState } from 'react'
import { api } from '../../../api/client'
import { getApiErrorMessage } from '../../../api/errors'
import type { Person, ReceptionItem, ReceptionPendingCount, Unit } from '../../../api/types'
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
import { localInputToUtcIso, utcIsoToLocalInput } from '../../../lib/datetime'
import { formDrawerSelectComboboxProps } from '../../../lib/formDrawerSelect'
import {
  asEnumName,
  enumIndex,
  isPendingPickup,
  labelForOption,
  RECEPTION_ITEM_STATUS_OPTIONS,
  RECEPTION_ITEM_TYPE_OPTIONS,
  receptionStatusVariant,
} from '../../../lib/receptionEnums'

function personLabel(p: Person) {
  return `${p.firstName} ${p.lastName} (${p.documentNumber})`
}

export function ReceptionItemsPage() {
  const propertyId = usePropertyId()
  const [drawer, setDrawer] = useState<'create' | ReceptionItem | null>(null)
  const invalidate = useInvalidate(['reception-items', 'reception-pending-count'])
  const list = usePagedListState('receivedatutc', {
    sortDir: 'desc',
    columnFilters: { horizontalPropertyId: propertyId },
  })
  const listQuery = usePagedListQuery<ReceptionItem>('reception-items', '/api/ReceptionItems', list)

  useEffect(() => {
    list.setFilter('horizontalPropertyId', propertyId)
  }, [propertyId, list.setFilter])

  const pendingQuery = useQuery({
    queryKey: ['reception-pending-count', propertyId],
    queryFn: async () => {
      const { data } = await api.get<ReceptionPendingCount>(
        `/api/ReceptionItems/pending-count?horizontalPropertyId=${encodeURIComponent(propertyId)}`,
      )
      return data
    },
  })

  const units = useEntityOptions<Unit>('unit-options', '/api/Units', {
    horizontalPropertyId: propertyId,
  })
  const people = useEntityOptions<Person>('people-options', '/api/People')

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
      itemType: 'Package',
      unitId: '' as string | null,
      personId: '' as string | null,
      recipientName: '',
      carrierOrSender: '',
      trackingOrReference: '',
      notes: '',
      receivedAt: utcIsoToLocalInput(new Date().toISOString()),
      isActive: true,
    },
    validate: {
      itemType: (v) => (!v ? 'Obligatorio' : null),
      receivedAt: (v) => (!v ? 'Obligatorio' : null),
    },
  })

  const openCreate = () => {
    form.setValues({
      itemType: 'Package',
      unitId: null,
      personId: null,
      recipientName: '',
      carrierOrSender: '',
      trackingOrReference: '',
      notes: '',
      receivedAt: utcIsoToLocalInput(new Date().toISOString()),
      isActive: true,
    })
    setDrawer('create')
  }

  const openEdit = (item: ReceptionItem) => {
    form.setValues({
      itemType: asEnumName(item.itemType, RECEPTION_ITEM_TYPE_OPTIONS) || 'Package',
      unitId: item.unitId,
      personId: item.personId,
      recipientName: item.recipientName ?? '',
      carrierOrSender: item.carrierOrSender ?? '',
      trackingOrReference: item.trackingOrReference ?? '',
      notes: item.notes ?? '',
      receivedAt: utcIsoToLocalInput(item.receivedAtUtc),
      isActive: item.isActive,
    })
    setDrawer(item)
  }

  const saveMutation = useMutation({
    mutationFn: async () => {
      const payload = {
        horizontalPropertyId: propertyId,
        itemType: enumIndex(form.values.itemType, RECEPTION_ITEM_TYPE_OPTIONS),
        unitId: form.values.unitId || null,
        personId: form.values.personId || null,
        recipientName: form.values.recipientName.trim() || null,
        carrierOrSender: form.values.carrierOrSender.trim() || null,
        trackingOrReference: form.values.trackingOrReference.trim() || null,
        notes: form.values.notes.trim() || null,
        receivedAtUtc: localInputToUtcIso(form.values.receivedAt),
      }
      if (drawer === 'create') {
        const { data } = await api.post<ReceptionItem>('/api/ReceptionItems', payload)
        return data
      }
      const { data } = await api.put<ReceptionItem>(`/api/ReceptionItems/${drawer!.id}`, {
        ...payload,
        isActive: form.values.isActive,
      })
      return data
    },
    onSuccess: () => {
      notifications.show({ title: 'Guardado', message: 'Ítem de portería guardado', color: 'teal' })
      setDrawer(null)
      invalidate()
    },
    onError: (err) =>
      notifications.show({ title: 'Error', message: getApiErrorMessage(err), color: 'red' }),
  })

  const deliverMutation = useMutation({
    mutationFn: (id: string) => api.post(`/api/ReceptionItems/${id}/deliver`, {}),
    onSuccess: () => {
      notifications.show({ title: 'Entregado', message: 'Ítem marcado como entregado', color: 'teal' })
      invalidate()
    },
    onError: (err) =>
      notifications.show({ title: 'Error', message: getApiErrorMessage(err), color: 'red' }),
  })

  const returnMutation = useMutation({
    mutationFn: (id: string) => api.post(`/api/ReceptionItems/${id}/return`, {}),
    onSuccess: () => {
      notifications.show({ title: 'Devuelto', message: 'Ítem marcado como devuelto', color: 'teal' })
      invalidate()
    },
    onError: (err) =>
      notifications.show({ title: 'Error', message: getApiErrorMessage(err), color: 'red' }),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/api/ReceptionItems/${id}`),
    onSuccess: () => {
      notifications.show({ title: 'Desactivado', message: 'Ítem de portería desactivado', color: 'gray' })
      invalidate()
    },
    onError: (err) =>
      notifications.show({ title: 'Error', message: getApiErrorMessage(err), color: 'red' }),
  })

  const pendingCount = pendingQuery.data?.pendingPickupCount ?? 0

  const columns = useMemo((): ColumnDef<ReceptionItem>[] => {
    return [
      {
        key: 'itemType',
        header: 'Tipo',
        sortKey: 'itemtype',
        filter: 'select',
        filterKey: 'itemType',
        filterOptions: RECEPTION_ITEM_TYPE_OPTIONS.map((o) => ({ value: o.value, label: o.label })),
        render: (row) => labelForOption(RECEPTION_ITEM_TYPE_OPTIONS, row.itemType),
      },
      {
        key: 'unit',
        header: 'Unidad',
        sortKey: 'unitid',
        filter: 'select',
        filterKey: 'unitId',
        filterOptions: unitOptions,
        render: (row) =>
          row.unitCode ?? (row.unitId ? unitOptions.find((u) => u.value === row.unitId)?.label : null) ?? '—',
      },
      {
        key: 'recipient',
        header: 'Destinatario',
        filter: 'none',
        render: (row) =>
          row.recipientName ||
          row.personName ||
          (row.personId
            ? personOptions.find((p) => p.value === row.personId)?.label
            : null) ||
          '—',
      },
      {
        key: 'receivedAt',
        header: 'Recibido',
        sortKey: 'receivedatutc',
        filter: 'none',
        render: (row) => new Date(row.receivedAtUtc).toLocaleString(),
      },
      {
        key: 'status',
        header: 'Estado',
        sortKey: 'status',
        filter: 'select',
        filterKey: 'status',
        filterOptions: RECEPTION_ITEM_STATUS_OPTIONS.map((o) => ({
          value: o.value,
          label: o.label,
        })),
        render: (row) => (
          <StatusBadge
            variant={receptionStatusVariant(row.status)}
            label={labelForOption(RECEPTION_ITEM_STATUS_OPTIONS, row.status)}
          />
        ),
      },
      {
        key: 'carrier',
        header: 'Transportadora / referencia',
        filter: 'none',
        render: (row) => {
          const parts = [row.carrierOrSender, row.trackingOrReference].filter(Boolean)
          return parts.length ? parts.join(' · ') : '—'
        },
      },
      activeColumn<ReceptionItem>(),
      {
        key: 'actions',
        header: '',
        filter: 'none',
        width: 220,
        render: (row) => (
          <Group gap={4} wrap="nowrap">
            {isPendingPickup(row.status) ? (
              <>
                <Tooltip label="Marcar entregado">
                  <Button
                    size="compact-xs"
                    variant="light"
                    color="teal"
                    loading={deliverMutation.isPending}
                    onClick={() => {
                      if (window.confirm('¿Marcar este ítem como entregado?')) {
                        deliverMutation.mutate(row.id)
                      }
                    }}
                  >
                    Entregado
                  </Button>
                </Tooltip>
                <Tooltip label="Marcar devuelto">
                  <Button
                    size="compact-xs"
                    variant="light"
                    color="orange"
                    loading={returnMutation.isPending}
                    onClick={() => {
                      if (window.confirm('¿Marcar este ítem como devuelto?')) {
                        returnMutation.mutate(row.id)
                      }
                    }}
                  >
                    Devuelto
                  </Button>
                </Tooltip>
              </>
            ) : null}
            <ActionIcon variant="light" size="md" onClick={() => openEdit(row)} aria-label="Editar">
              ✎
            </ActionIcon>
            <ActionIcon
              variant="light"
              color="red"
              size="md"
              onClick={() => {
                if (window.confirm('¿Desactivar este ítem de portería?')) deleteMutation.mutate(row.id)
              }}
              aria-label="Eliminar"
            >
              ✕
            </ActionIcon>
          </Group>
        ),
      },
    ]
  }, [deleteMutation, deliverMutation, personOptions, returnMutation, unitOptions])

  return (
    <Stack gap="md">
      <PageHeader
        title="Portería"
        description="Paquetes, cartas y mensajes de visitantes en portería."
      />
      {pendingCount > 0 ? (
        <Alert
          color="orange"
          variant="light"
          icon={<IconPackage size={18} stroke={1.75} />}
          title={
            <Group gap="xs">
              <Text fw={600} size="sm">
                Pendiente de retiro
              </Text>
              <Badge color="orange" variant="filled" size="sm">
                {pendingCount}
              </Badge>
            </Group>
          }
        >
          {pendingCount === 1
            ? '1 ítem está pendiente de retiro.'
            : `${pendingCount} ítems están pendientes de retiro.`}
        </Alert>
      ) : (
        <Alert color="teal" variant="light" icon={<IconPackage size={18} stroke={1.75} />}>
          No hay ítems pendientes de retiro.
        </Alert>
      )}
      <ListToolbar
        onAdd={openCreate}
        addLabel="Agregar ítem"
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
            title={labelForOption(RECEPTION_ITEM_TYPE_OPTIONS, item.itemType)}
            subtitle={`${item.recipientName || item.personName || '—'} · ${labelForOption(RECEPTION_ITEM_STATUS_OPTIONS, item.status)}`}
            inactive={!item.isActive}
            onEdit={() => openEdit(item)}
            onDelete={() => {
              if (window.confirm('¿Desactivar este ítem de portería?')) deleteMutation.mutate(item.id)
            }}
          />
        )}
      />

      <FormDrawer
        opened={drawer !== null}
        onClose={() => setDrawer(null)}
        title={drawer === 'create' ? 'Nuevo ítem de portería' : 'Editar ítem de portería'}
      >
        <form onSubmit={form.onSubmit(() => saveMutation.mutate())}>
          <Stack gap="sm">
            <Select
              label="Tipo de ítem"
              required
              data={[...RECEPTION_ITEM_TYPE_OPTIONS]}
              comboboxProps={formDrawerSelectComboboxProps}
              {...form.getInputProps('itemType')}
            />
            <Select
              label="Unidad (opcional)"
              data={unitOptions}
              searchable
              clearable
              comboboxProps={formDrawerSelectComboboxProps}
              value={form.values.unitId || null}
              onChange={(v) => form.setFieldValue('unitId', v)}
            />
            <Select
              label="Persona (opcional)"
              data={personOptions}
              searchable
              clearable
              comboboxProps={formDrawerSelectComboboxProps}
              value={form.values.personId || null}
              onChange={(v) => form.setFieldValue('personId', v)}
            />
            <TextInput label="Nombre del destinatario" {...form.getInputProps('recipientName')} />
            <TextInput label="Transportadora / remitente" {...form.getInputProps('carrierOrSender')} />
            <TextInput label="Guía / referencia" {...form.getInputProps('trackingOrReference')} />
            <TextInput
              label="Recibido el"
              type="datetime-local"
              required
              {...form.getInputProps('receivedAt')}
            />
            <Textarea label="Notas" minRows={2} {...form.getInputProps('notes')} />
            {drawer !== 'create' ? (
              <Switch label="Activo" {...form.getInputProps('isActive', { type: 'checkbox' })} />
            ) : null}
            <Button type="submit" fullWidth loading={saveMutation.isPending}>
              Guardar
            </Button>
          </Stack>
        </form>
      </FormDrawer>
    </Stack>
  )
}
