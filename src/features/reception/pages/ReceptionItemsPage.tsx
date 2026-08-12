import {
  ActionIcon,
  Alert,
  Badge,
  Button,
  Group,
  Modal,
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
import { useEffect, useMemo, useRef, useState } from 'react'
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
import { localInputToUtcIso, utcIsoToLocalInput, localTodayStartInput, isLocalInputBeforeToday } from '../../../lib/datetime'
import { formDrawerSelectComboboxProps } from '../../../lib/formDrawerSelect'
import { toDwellingUnitSelectOptions } from '../../../lib/unitLabels'
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

export function ReceptionItemsPage() {
  const propertyId = usePropertyId()
  const [drawer, setDrawer] = useState<'create' | ReceptionItem | null>(null)
  const drawerRef = useRef(drawer)
  drawerRef.current = drawer
  const [deliverItem, setDeliverItem] = useState<ReceptionItem | null>(null)
  const [deliveredToPersonId, setDeliveredToPersonId] = useState<string | null>(null)
  const [deliverError, setDeliverError] = useState<string | null>(null)
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
      itemType: 'Package',
      unitId: '' as string,
      personId: '' as string,
      carrierOrSender: '',
      trackingOrReference: '',
      notes: '',
      receivedAt: utcIsoToLocalInput(new Date().toISOString()),
      isActive: true,
    },
    validate: {
      itemType: (v) => (!v ? 'Obligatorio' : null),
      unitId: (v) => (!v ? 'Obligatorio' : null),
      personId: (v) => (!v ? 'Obligatorio' : null),
      receivedAt: (v) => {
        if (!v) return 'Obligatorio'
        if (!isLocalInputBeforeToday(v)) return null
        const current = drawerRef.current
        // Allow keeping an existing past value when editing older items.
        if (
          current !== null &&
          current !== 'create' &&
          utcIsoToLocalInput(current.receivedAtUtc) === v
        ) {
          return null
        }
        return 'La fecha de recepción no puede ser anterior a hoy'
      },
    },
  })

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
    !!deliverUnitId,
  )

  const unitOptions = useMemo(
    () => toDwellingUnitSelectOptions(units.data ?? [], buildingById),
    [units.data, buildingById],
  )
  const destinatarioOptions = useMemo(
    () => habitantOptionsFrom(formOccupancies.data, people.data),
    [formOccupancies.data, people.data],
  )
  const deliverHabitantOptions = useMemo(
    () => habitantOptionsFrom(deliverOccupancies.data, people.data),
    [deliverOccupancies.data, people.data],
  )

  useEffect(() => {
    if (!form.values.personId || !formUnitId || formOccupancies.isLoading) return
    if (!destinatarioOptions.some((o) => o.value === form.values.personId)) {
      form.setFieldValue('personId', '')
    }
  }, [destinatarioOptions, form.values.personId, formUnitId, formOccupancies.isLoading])

  const openCreate = () => {
    form.setValues({
      itemType: 'Package',
      unitId: '',
      personId: '',
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
      unitId: item.unitId ?? '',
      personId: item.personId ?? '',
      carrierOrSender: item.carrierOrSender ?? '',
      trackingOrReference: item.trackingOrReference ?? '',
      notes: item.notes ?? '',
      receivedAt: utcIsoToLocalInput(item.receivedAtUtc),
      isActive: item.isActive,
    })
    setDrawer(item)
  }

  const openDeliver = (item: ReceptionItem) => {
    setDeliverError(null)
    setDeliveredToPersonId(item.personId)
    setDeliverItem(item)
  }

  const saveMutation = useMutation({
    mutationFn: async () => {
      const payload = {
        horizontalPropertyId: propertyId,
        itemType: enumIndex(form.values.itemType, RECEPTION_ITEM_TYPE_OPTIONS),
        unitId: form.values.unitId,
        personId: form.values.personId,
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
        status: enumIndex(
          asEnumName(drawer!.status, RECEPTION_ITEM_STATUS_OPTIONS) || 'PendingPickup',
          RECEPTION_ITEM_STATUS_OPTIONS,
        ),
        deliveredAtUtc: drawer!.deliveredAtUtc,
        deliveredByEmployeeId: drawer!.deliveredByEmployeeId,
        deliveredToPersonId: drawer!.deliveredToPersonId,
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
      if (!deliverItem || !deliveredToPersonId) {
        throw new Error('Selecciona quién recibe la entrega.')
      }
      const { data } = await api.post<ReceptionItem>(`/api/ReceptionItems/${deliverItem.id}/deliver`, {
        deliveredToPersonId,
      })
      return data
    },
    onSuccess: () => {
      notifications.show({ title: 'Entregado', message: 'Ítem marcado como entregado', color: 'teal' })
      setDeliverItem(null)
      setDeliveredToPersonId(null)
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
        render: (row) => row.personName || row.recipientName || '—',
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
        render: (row) => row.deliveredToPersonName || '—',
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
            subtitle={`${item.personName || item.recipientName || '—'} · ${labelForOption(RECEPTION_ITEM_STATUS_OPTIONS, item.status)}`}
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
              label="Destinatario"
              required
              placeholder={form.values.unitId ? 'Seleccione un habitante' : 'Primero elige la unidad'}
              data={destinatarioOptions}
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
            <TextInput label="Transportadora / remitente" {...form.getInputProps('carrierOrSender')} />
            <TextInput label="Guía / referencia" {...form.getInputProps('trackingOrReference')} />
            <TextInput
              label="Recibido el"
              type="datetime-local"
              required
              min={drawer === 'create' ? localTodayStartInput() : undefined}
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

      <Modal
        opened={deliverItem !== null}
        onClose={() => {
          setDeliverItem(null)
          setDeliverError(null)
          setDeliveredToPersonId(null)
        }}
        title="Registrar entrega"
        centered
      >
        <Stack gap="sm">
          <Text size="sm" c="dimmed">
            Indica quién recibe el ítem. La fecha y hora de entrega se registrarán automáticamente.
          </Text>
          {deliverError ? (
            <Alert color="orange" variant="light" title="No se pudo entregar" withCloseButton onClose={() => setDeliverError(null)}>
              {deliverError}
            </Alert>
          ) : null}
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
              disabled={!deliveredToPersonId}
              onClick={() => deliverMutation.mutate()}
            >
              Confirmar entrega
            </Button>
          </Group>
        </Stack>
      </Modal>
    </Stack>
  )
}
