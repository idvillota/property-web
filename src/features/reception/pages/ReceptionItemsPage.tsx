import {
  ActionIcon,
  Alert,
  Badge,
  Button,
  Group,
  Modal,
  Paper,
  SegmentedControl,
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
import { IconFileInvoice, IconPackage } from '@tabler/icons-react'
import { useMutation, useQuery } from '@tanstack/react-query'
import { useEffect, useMemo, useState } from 'react'
import { api } from '../../../api/client'
import { getApiErrorMessage } from '../../../api/errors'
import type {
  Person,
  ReceptionItem,
  ReceptionPendingCount,
  Unit,
  UnitOccupancy,
} from '../../../api/types'
import { EntityCard } from '../../../components/crud/EntityCard'
import { FormDrawer } from '../../../components/crud/FormDrawer'
import { ListToolbar } from '../../../components/crud/ListToolbar'
import { PagedEntityView } from '../../../components/data-table/PagedEntityView'
import { activeColumn } from '../../../components/data-table/tableColumns'
import type { ColumnDef } from '../../../components/data-table/types'
import { PageHeader } from '../../../components/shared/PageHeader'
import { StatusBadge } from '../../../components/shared/StatusBadge'
import { useEntityOptions } from '../../../hooks/useEntityOptions'
import { useBuildingById } from '../../../hooks/useBuildingById'
import { useInvalidate } from '../../../hooks/useInvalidate'
import { usePagedListQuery } from '../../../hooks/usePagedListQuery'
import { usePagedListState } from '../../../hooks/usePagedListState'
import { usePropertyId } from '../../../hooks/usePropertyId'
import { formDrawerSelectComboboxProps } from '../../../lib/formDrawerSelect'
import { toDwellingUnitSelectOptions } from '../../../lib/unitLabels'
import {
  asEnumName,
  enumIndex,
  isOutboundDirection,
  isPendingPickup,
  isUtilityBillItemType,
  labelForOption,
  RECEPTION_DIRECTION_OPTIONS,
  RECEPTION_ITEM_STATUS_OPTIONS,
  RECEPTION_ITEM_TYPE_OPTIONS,
  RECEPTION_MANUAL_ITEM_TYPE_OPTIONS,
  receptionStatusLabel,
  receptionStatusVariant,
  UTILITY_BILL_TYPE_OPTIONS,
} from '../../../lib/receptionEnums'

function personLabel(p: Person) {
  return `${p.firstName} ${p.lastName} (${p.documentNumber})`
}

function habitantOptionsFrom(
  occupancies: UnitOccupancy[] | undefined,
  people: Person[] | undefined,
): { value: string; label: string }[] {
  const peopleById = new Map((people ?? []).map((p) => [p.id, p]))
  const byPerson = new Map<string, { value: string; label: string }>()
  for (const occupancy of occupancies ?? []) {
    if (byPerson.has(occupancy.personId)) continue
    const person = peopleById.get(occupancy.personId)
    byPerson.set(occupancy.personId, {
      value: occupancy.personId,
      label: person
        ? personLabel(person)
        : (occupancy.personName ?? occupancy.personId),
    })
  }
  return [...byPerson.values()]
}

function authorizedPickupOptions(item: ReceptionItem | null): { value: string; label: string }[] {
  if (!item) return []
  return [item.authorizedPickupName1, item.authorizedPickupName2]
    .filter((name): name is string => !!name?.trim())
    .map((name) => ({ value: name, label: name }))
}

export function ReceptionItemsPage() {
  const propertyId = usePropertyId()
  const [drawer, setDrawer] = useState<'create' | ReceptionItem | null>(null)
  const [deliverItem, setDeliverItem] = useState<ReceptionItem | null>(null)
  const [deliveredToPersonId, setDeliveredToPersonId] = useState<string | null>(null)
  const [deliveredToExternalName, setDeliveredToExternalName] = useState<string | null>(null)
  const [deliverError, setDeliverError] = useState<string | null>(null)
  const [billsOpen, setBillsOpen] = useState(false)
  const [billType, setBillType] = useState<string>('WaterBill')
  const [billPeriod, setBillPeriod] = useState(() => {
    const d = new Date()
    const pad = (n: number) => String(n).padStart(2, '0')
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}`
  })
  const [billsError, setBillsError] = useState<string | null>(null)
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
  const { buildingById } = useBuildingById(propertyId)
  const people = useEntityOptions<Person>('people-options', '/api/People')

  const form = useForm({
    initialValues: {
      direction: 'Inbound',
      itemType: 'Package',
      unitId: '' as string,
      personId: '' as string,
      carrierOrSender: '',
      trackingOrReference: '',
      authorizedPickupName1: '',
      authorizedPickupName2: '',
      notes: '',
      notify: true,
      isActive: true,
    },
    validate: {
      direction: (v) => (!v ? 'Obligatorio' : null),
      itemType: (v) => (!v ? 'Obligatorio' : null),
      unitId: (v) => (!v ? 'Obligatorio' : null),
      personId: (v) => (!v ? 'Obligatorio' : null),
      authorizedPickupName1: (v, values) => {
        if (values.direction !== 'Outbound') return null
        return v.trim() ? null : 'Indica al menos un receptor autorizado'
      },
      authorizedPickupName2: (v, values) => {
        if (values.direction !== 'Outbound') return null
        const n1 = values.authorizedPickupName1.trim()
        const n2 = v.trim()
        if (n1 && n2 && n1.toLowerCase() === n2.toLowerCase()) {
          return 'Los dos receptores deben ser distintos'
        }
        return null
      },
    },
  })

  const isOutbound = form.values.direction === 'Outbound'
  const formUnitId = form.values.unitId || undefined
  const formOccupancies = useEntityOptions<UnitOccupancy>(
    'reception-form-occupancies',
    '/api/UnitOccupancies',
    formUnitId ? { unitId: formUnitId } : undefined,
    !!formUnitId,
  )
  const deliverUnitId = deliverItem?.unitId || undefined
  const deliverOccupancies = useEntityOptions<UnitOccupancy>(
    'reception-deliver-occupancies',
    '/api/UnitOccupancies',
    deliverUnitId ? { unitId: deliverUnitId } : undefined,
    !!deliverUnitId && !isOutboundDirection(deliverItem?.direction),
  )

  const unitOptions = useMemo(
    () => toDwellingUnitSelectOptions(units.data ?? [], buildingById),
    [units.data, buildingById],
  )
  const habitantOptions = useMemo(
    () => habitantOptionsFrom(formOccupancies.data, people.data),
    [formOccupancies.data, people.data],
  )
  const deliverHabitantOptions = useMemo(
    () => habitantOptionsFrom(deliverOccupancies.data, people.data),
    [deliverOccupancies.data, people.data],
  )
  const deliverExternalOptions = useMemo(
    () => authorizedPickupOptions(deliverItem),
    [deliverItem],
  )

  useEffect(() => {
    if (!form.values.personId || !formUnitId || formOccupancies.isLoading) return
    if (!habitantOptions.some((o) => o.value === form.values.personId)) {
      form.setFieldValue('personId', '')
    }
  }, [habitantOptions, form.values.personId, formUnitId, formOccupancies.isLoading])

  const openCreate = () => {
    form.setValues({
      direction: 'Inbound',
      itemType: 'Package',
      unitId: '',
      personId: '',
      carrierOrSender: '',
      trackingOrReference: '',
      authorizedPickupName1: '',
      authorizedPickupName2: '',
      notes: '',
      notify: true,
      isActive: true,
    })
    setDrawer('create')
  }

  const openEdit = (item: ReceptionItem) => {
    form.setValues({
      direction: asEnumName(item.direction, RECEPTION_DIRECTION_OPTIONS) || 'Inbound',
      itemType: asEnumName(item.itemType, RECEPTION_ITEM_TYPE_OPTIONS) || 'Package',
      unitId: item.unitId ?? '',
      personId: item.personId ?? '',
      carrierOrSender: item.carrierOrSender ?? '',
      trackingOrReference: item.trackingOrReference ?? '',
      authorizedPickupName1: item.authorizedPickupName1 ?? '',
      authorizedPickupName2: item.authorizedPickupName2 ?? '',
      notes: item.notes ?? '',
      notify: true,
      isActive: item.isActive,
    })
    setDrawer(item)
  }

  const openDeliver = (item: ReceptionItem) => {
    setDeliverError(null)
    setDeliveredToPersonId(item.personId)
    setDeliveredToExternalName(item.authorizedPickupName1)
    setDeliverItem(item)
  }

  const saveMutation = useMutation({
    mutationFn: async () => {
      const outbound = form.values.direction === 'Outbound'
      const payload = {
        horizontalPropertyId: propertyId,
        direction: enumIndex(form.values.direction, RECEPTION_DIRECTION_OPTIONS),
        itemType: enumIndex(form.values.itemType, RECEPTION_ITEM_TYPE_OPTIONS),
        unitId: form.values.unitId,
        personId: form.values.personId,
        carrierOrSender: outbound ? null : form.values.carrierOrSender.trim() || null,
        trackingOrReference: outbound ? null : form.values.trackingOrReference.trim() || null,
        authorizedPickupName1: outbound ? form.values.authorizedPickupName1.trim() || null : null,
        authorizedPickupName2: outbound ? form.values.authorizedPickupName2.trim() || null : null,
        notes: form.values.notes.trim() || null,
        ...(drawer === 'create' ? { notify: form.values.notify } : {}),
      }
      if (drawer === 'create') {
        const { data } = await api.post<ReceptionItem>('/api/ReceptionItems', payload)
        return data
      }
      const { data } = await api.put<ReceptionItem>(`/api/ReceptionItems/${drawer!.id}`, {
        ...payload,
        status: enumIndex(
          asEnumName(drawer!.status, RECEPTION_ITEM_STATUS_OPTIONS) || 'PendingPickup',
          RECEPTION_ITEM_STATUS_OPTIONS,
        ),
        deliveredAtUtc: drawer!.deliveredAtUtc,
        deliveredByEmployeeId: drawer!.deliveredByEmployeeId,
        deliveredToPersonId: outbound ? null : drawer!.deliveredToPersonId,
        deliveredToExternalName: outbound ? drawer!.deliveredToExternalName : null,
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
      notifications.show({
        title: 'No se pudo guardar',
        message: getApiErrorMessage(err),
        color: 'red',
      }),
  })

  const deliverMutation = useMutation({
    mutationFn: async () => {
      if (!deliverItem) throw new Error('Ítem no seleccionado.')
      const outbound = isOutboundDirection(deliverItem.direction)
      if (outbound) {
        if (!deliveredToExternalName) throw new Error('Selecciona el receptor autorizado.')
        const { data } = await api.post<ReceptionItem>(`/api/ReceptionItems/${deliverItem.id}/deliver`, {
          deliveredToExternalName,
        })
        return data
      }
      if (!deliveredToPersonId) throw new Error('Selecciona el habitante que recibe.')
      const { data } = await api.post<ReceptionItem>(`/api/ReceptionItems/${deliverItem.id}/deliver`, {
        deliveredToPersonId,
      })
      return data
    },
    onSuccess: () => {
      notifications.show({ title: 'Entregado', message: 'Ítem marcado como entregado', color: 'teal' })
      setDeliverItem(null)
      setDeliveredToPersonId(null)
      setDeliveredToExternalName(null)
      setDeliverError(null)
      invalidate()
    },
    onError: (err) => {
      setDeliverError(getApiErrorMessage(err, 'No se pudo registrar la entrega.'))
    },
  })

  const returnMutation = useMutation({
    mutationFn: (id: string) => api.post(`/api/ReceptionItems/${id}/return`, {}),
    onSuccess: () => {
      notifications.show({ title: 'Devuelto', message: 'Ítem marcado como devuelto', color: 'teal' })
      invalidate()
    },
    onError: (err) =>
      notifications.show({
        title: 'No se pudo devolver',
        message: getApiErrorMessage(err),
        color: 'red',
      }),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/api/ReceptionItems/${id}`),
    onSuccess: () => {
      notifications.show({ title: 'Desactivado', message: 'Ítem de portería desactivado', color: 'gray' })
      invalidate()
    },
    onError: (err) =>
      notifications.show({
        title: 'No se pudo desactivar',
        message: getApiErrorMessage(err),
        color: 'red',
      }),
  })

  const bulkBillsMutation = useMutation({
    mutationFn: async () => {
      const { data } = await api.post<{
        period: string
        billType: string | number
        createdCount: number
        skippedAlreadyExistsCount: number
        skippedNoHabitantCount: number
        dwellingUnitCount: number
      }>('/api/ReceptionItems/bulk-utility-bills', {
        horizontalPropertyId: propertyId,
        billType: enumIndex(billType, RECEPTION_ITEM_TYPE_OPTIONS),
        period: billPeriod,
      })
      return data
    },
    onSuccess: (result) => {
      const billLabel = labelForOption(UTILITY_BILL_TYPE_OPTIONS, billType)
      notifications.show({
        title: 'Facturas registradas',
        message: `${billLabel} · ${result.period}: ${result.createdCount} creadas, ${result.skippedAlreadyExistsCount} ya existían, ${result.skippedNoHabitantCount} sin responsable de comunicaciones.`,
        color: 'teal',
      })
      setBillsOpen(false)
      setBillsError(null)
      invalidate()
    },
    onError: (err) => {
      setBillsError(getApiErrorMessage(err, 'No se pudieron registrar las facturas.'))
    },
  })

  const pendingCount = pendingQuery.data?.pendingPickupCount ?? 0
  const deliverIsOutbound = isOutboundDirection(deliverItem?.direction)
  const canConfirmDeliver = deliverIsOutbound ? !!deliveredToExternalName : !!deliveredToPersonId

  const columns = useMemo((): ColumnDef<ReceptionItem>[] => {
    return [
      {
        key: 'direction',
        header: 'Sentido',
        sortKey: 'direction',
        filter: 'select',
        filterKey: 'direction',
        filterOptions: RECEPTION_DIRECTION_OPTIONS.map((o) => ({ value: o.value, label: o.label })),
        render: (row) => (
          <Badge
            variant="light"
            color={isOutboundDirection(row.direction) ? 'violet' : 'blue'}
          >
            {labelForOption(RECEPTION_DIRECTION_OPTIONS, row.direction)}
          </Badge>
        ),
      },
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
        key: 'person',
        header: 'Habitante',
        filter: 'none',
        render: (row) => row.personName || row.recipientName || '—',
      },
      {
        key: 'authorized',
        header: 'Receptores autorizados',
        filter: 'none',
        render: (row) => {
          if (!isOutboundDirection(row.direction)) return '—'
          const names = [row.authorizedPickupName1, row.authorizedPickupName2].filter(Boolean)
          return names.length ? names.join(' · ') : '—'
        },
      },
      {
        key: 'receivedAt',
        header: 'Recibido',
        sortKey: 'receivedatutc',
        filter: 'none',
        render: (row) => new Date(row.receivedAtUtc).toLocaleString(),
      },
      {
        key: 'deliveredAt',
        header: 'Entregado',
        sortKey: 'deliveredatutc',
        filter: 'none',
        render: (row) => (row.deliveredAtUtc ? new Date(row.deliveredAtUtc).toLocaleString() : '—'),
      },
      {
        key: 'deliveredTo',
        header: 'Entregado a',
        filter: 'none',
        render: (row) =>
          row.deliveredToPersonName || row.deliveredToExternalName || '—',
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
            label={receptionStatusLabel(row.status, row.direction)}
          />
        ),
      },
      {
        key: 'carrier',
        header: 'Transportadora / guía',
        filter: 'none',
        render: (row) => {
          if (isOutboundDirection(row.direction)) return '—'
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
                    onClick={() => openDeliver(row)}
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
  }, [deleteMutation, returnMutation, unitOptions])

  return (
    <Stack gap="md">
      <PageHeader
        title="Portería"
        description="Ítems entrantes para la unidad y encargos salientes para retiro externo."
      />
      {pendingCount > 0 ? (
        <Alert
          color="orange"
          variant="light"
          icon={<IconPackage size={18} stroke={1.75} />}
          title={
            <Group gap="xs">
              <Text fw={600} size="sm">
                Pendientes
              </Text>
              <Badge color="orange" variant="filled" size="sm">
                {pendingCount}
              </Badge>
            </Group>
          }
        >
          {pendingCount === 1
            ? '1 ítem está pendiente de entrega o retiro.'
            : `${pendingCount} ítems están pendientes de entrega o retiro.`}
        </Alert>
      ) : (
        <Alert color="teal" variant="light" icon={<IconPackage size={18} stroke={1.75} />}>
          No hay ítems pendientes.
        </Alert>
      )}
      <ListToolbar
        onAdd={openCreate}
        addLabel="Agregar ítem"
        includeInactive={list.state.includeInactive}
        onIncludeInactiveChange={list.setIncludeInactive}
        extra={
          <Button
            variant="default"
            leftSection={<IconFileInvoice size={16} stroke={1.75} />}
            onClick={() => {
              setBillsError(null)
              setBillsOpen(true)
            }}
          >
            Registrar facturas
          </Button>
        }
      />
      <Paper withBorder p="sm" radius="md">
        <Group gap="md" align="flex-end" wrap="wrap">
          <Stack gap={4} style={{ flex: '1 1 220px', minWidth: 200 }}>
            <Text size="sm" fw={500}>
              Unidad
            </Text>
            <Select
              placeholder="Todas las unidades"
              searchable
              clearable
              data={unitOptions}
              value={list.state.columnFilters.unitId ?? null}
              onChange={(v) => list.setColumnFilter('unitId', v ?? '')}
            />
          </Stack>
          <Stack gap={4}>
            <Text size="sm" fw={500}>
              Sentido
            </Text>
            <SegmentedControl
              data={[
                { value: 'all', label: 'Todos' },
                ...RECEPTION_DIRECTION_OPTIONS.map((o) => ({ value: o.value, label: o.label })),
              ]}
              value={list.state.columnFilters.direction ?? 'all'}
              onChange={(v) => list.setColumnFilter('direction', v === 'all' ? '' : v)}
            />
          </Stack>
          {(list.state.columnFilters.unitId || list.state.columnFilters.direction) && (
            <Button
              variant="subtle"
              color="gray"
              onClick={() => {
                list.setColumnFilter('unitId', '')
                list.setColumnFilter('direction', '')
              }}
            >
              Limpiar filtros
            </Button>
          )}
        </Group>
      </Paper>
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
            title={`${labelForOption(RECEPTION_DIRECTION_OPTIONS, item.direction)} · ${labelForOption(RECEPTION_ITEM_TYPE_OPTIONS, item.itemType)}`}
            subtitle={`${item.personName || item.recipientName || '—'} · ${receptionStatusLabel(item.status, item.direction)}`}
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
            <Stack gap={4}>
              <Text size="sm" fw={500}>
                Sentido
              </Text>
              <SegmentedControl
                fullWidth
                data={[...RECEPTION_DIRECTION_OPTIONS]}
                value={form.values.direction}
                onChange={(v) => form.setFieldValue('direction', v)}
              />
            </Stack>
            <Select
              label="Tipo de ítem"
              required
              data={
                isUtilityBillItemType(form.values.itemType)
                  ? [...RECEPTION_ITEM_TYPE_OPTIONS]
                  : [...RECEPTION_MANUAL_ITEM_TYPE_OPTIONS]
              }
              comboboxProps={formDrawerSelectComboboxProps}
              disabled={isUtilityBillItemType(form.values.itemType)}
              description={
                isUtilityBillItemType(form.values.itemType)
                  ? 'Las facturas se gestionan con “Registrar facturas”.'
                  : undefined
              }
              {...form.getInputProps('itemType')}
            />
            <Select
              label="Unidad"
              required
              data={unitOptions}
              searchable
              comboboxProps={formDrawerSelectComboboxProps}
              value={form.values.unitId || null}
              onChange={(v) => {
                form.setFieldValue('unitId', v ?? '')
                form.setFieldValue('personId', '')
              }}
              error={form.errors.unitId}
            />
            <Select
              label={isOutbound ? 'Quien deja el artículo' : 'Destinatario'}
              required
              description={
                isOutbound
                  ? 'Habitante de la unidad que deja el ítem en portería'
                  : 'Habitante de la unidad al que va dirigido el ítem'
              }
              placeholder={form.values.unitId ? 'Seleccione un habitante' : 'Primero elige la unidad'}
              data={habitantOptions}
              searchable
              disabled={!form.values.unitId}
              comboboxProps={formDrawerSelectComboboxProps}
              value={form.values.personId || null}
              onChange={(v) => form.setFieldValue('personId', v ?? '')}
              error={form.errors.personId}
              nothingFoundMessage={
                formOccupancies.isLoading ? 'Cargando…' : 'No hay habitantes en esta unidad'
              }
            />
            {isOutbound ? (
              <>
                <TextInput
                  label="Receptor autorizado 1"
                  required
                  placeholder="Ej. Jhon Doe"
                  description="Persona externa que puede retirar el ítem"
                  {...form.getInputProps('authorizedPickupName1')}
                />
                <TextInput
                  label="Receptor autorizado 2 (opcional)"
                  placeholder="Segundo autorizado"
                  {...form.getInputProps('authorizedPickupName2')}
                />
              </>
            ) : (
              <>
                <TextInput label="Transportadora / remitente" {...form.getInputProps('carrierOrSender')} />
                <TextInput label="Guía / referencia" {...form.getInputProps('trackingOrReference')} />
              </>
            )}
            <Textarea label="Notas" minRows={2} {...form.getInputProps('notes')} />
            {drawer === 'create' ? (
              <Switch
                label="Notificar al residente"
                description="Envía email al contacto de la unidad"
                {...form.getInputProps('notify', { type: 'checkbox' })}
              />
            ) : null}
            {drawer !== 'create' ? (
              <Switch label="Activo" {...form.getInputProps('isActive', { type: 'checkbox' })} />
            ) : null}
            <Button type="submit" fullWidth loading={saveMutation.isPending}>
              Guardar
            </Button>
          </Stack>
        </form>
      </FormDrawer>

      <Modal
        opened={deliverItem !== null}
        onClose={() => {
          setDeliverItem(null)
          setDeliverError(null)
          setDeliveredToPersonId(null)
          setDeliveredToExternalName(null)
        }}
        title="Registrar entrega"
        centered
      >
        <Stack gap="sm">
          <Text size="sm" c="dimmed">
            {deliverIsOutbound
              ? 'Confirma qué receptor autorizado retira el ítem. La fecha y hora se registran automáticamente.'
              : 'Indica el habitante que recibe el ítem. La fecha y hora se registran automáticamente.'}
          </Text>
          {deliverError ? (
            <Alert
              color="orange"
              variant="light"
              title="No se pudo entregar"
              withCloseButton
              onClose={() => setDeliverError(null)}
            >
              {deliverError}
            </Alert>
          ) : null}
          {deliverIsOutbound ? (
            <Select
              label="Entregado a"
              required
              placeholder="Seleccione un receptor autorizado"
              data={deliverExternalOptions}
              comboboxProps={formDrawerSelectComboboxProps}
              value={deliveredToExternalName}
              onChange={setDeliveredToExternalName}
              nothingFoundMessage="No hay receptores autorizados"
            />
          ) : (
            <Select
              label="Entregado a"
              required
              placeholder={
                deliverItem?.unitId
                  ? 'Seleccione un habitante de la unidad'
                  : 'Este ítem no tiene unidad asociada'
              }
              data={deliverHabitantOptions}
              searchable
              disabled={!deliverItem?.unitId}
              comboboxProps={formDrawerSelectComboboxProps}
              value={deliveredToPersonId}
              onChange={setDeliveredToPersonId}
              nothingFoundMessage={
                deliverOccupancies.isLoading ? 'Cargando…' : 'No hay habitantes en esta unidad'
              }
            />
          )}
          <Group justify="flex-end" mt="xs">
            <Button
              variant="default"
              onClick={() => {
                setDeliverItem(null)
                setDeliverError(null)
              }}
            >
              Cancelar
            </Button>
            <Button
              color="teal"
              loading={deliverMutation.isPending}
              disabled={!canConfirmDeliver}
              onClick={() => deliverMutation.mutate()}
            >
              Confirmar entrega
            </Button>
          </Group>
        </Stack>
      </Modal>

      <Modal
        opened={billsOpen}
        onClose={() => {
          setBillsOpen(false)
          setBillsError(null)
        }}
        title="Registrar facturas del mes"
        centered
        size="md"
      >
        <Stack gap="md">
          <Text size="sm" c="dimmed">
            Genera un ítem entrante pendiente para cada apartamento o casa activo. Las unidades sin
            responsable de comunicaciones o con la factura ya registrada se omiten.
          </Text>
          {billsError ? (
            <Alert
              color="orange"
              variant="light"
              title="No se pudo registrar"
              withCloseButton
              onClose={() => setBillsError(null)}
            >
              {billsError}
            </Alert>
          ) : null}
          <Stack gap={6}>
            <Text size="sm" fw={500}>
              Tipo de factura
            </Text>
            <SegmentedControl
              fullWidth
              value={billType}
              onChange={setBillType}
              data={UTILITY_BILL_TYPE_OPTIONS.map((o) => ({
                value: o.value,
                label: o.label,
              }))}
            />
          </Stack>
          <TextInput
            label="Período"
            type="month"
            required
            description="Mes de la factura"
            value={billPeriod}
            onChange={(e) => setBillPeriod(e.currentTarget.value)}
          />
          <Group justify="flex-end" gap="sm" mt={4}>
            <Button
              variant="default"
              onClick={() => {
                setBillsOpen(false)
                setBillsError(null)
              }}
            >
              Cancelar
            </Button>
            <Button
              leftSection={<IconFileInvoice size={16} stroke={1.75} />}
              loading={bulkBillsMutation.isPending}
              disabled={!billType || !billPeriod}
              onClick={() => bulkBillsMutation.mutate()}
            >
              Registrar para todas las unidades
            </Button>
          </Group>
        </Stack>
      </Modal>
    </Stack>
  )
}
