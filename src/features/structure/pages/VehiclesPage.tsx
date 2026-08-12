import {
  ActionIcon,
  Badge,
  Button,
  Divider,
  Group,
  Select,
  Stack,
  Switch,
  Text,
  TextInput,
} from '@mantine/core'
import { useForm } from '@mantine/form'
import { notifications } from '@mantine/notifications'
import { useMutation, useQuery } from '@tanstack/react-query'
import { useEffect, useMemo, useState } from 'react'
import { api } from '../../../api/client'
import { getApiErrorMessage } from '../../../api/errors'
import { buildListUrl, type PagedResult } from '../../../api/paging'
import type { Unit, Vehicle, VehicleBrand } from '../../../api/types'
import { EntityCard } from '../../../components/crud/EntityCard'
import { FormDrawer } from '../../../components/crud/FormDrawer'
import { ListToolbar } from '../../../components/crud/ListToolbar'
import { PagedEntityView } from '../../../components/data-table/PagedEntityView'
import { activeColumn } from '../../../components/data-table/tableColumns'
import type { ColumnDef } from '../../../components/data-table/types'
import { PageHeader } from '../../../components/shared/PageHeader'
import { useEntityOptions } from '../../../hooks/useEntityOptions'
import { useBuildingById } from '../../../hooks/useBuildingById'
import { useInvalidate } from '../../../hooks/useInvalidate'
import { usePagedListQuery } from '../../../hooks/usePagedListQuery'
import { usePagedListState } from '../../../hooks/usePagedListState'
import { usePropertyId } from '../../../hooks/usePropertyId'
import { formDrawerSelectComboboxProps } from '../../../lib/formDrawerSelect'
import { labelForOption, VEHICLE_TYPE_OPTIONS } from '../../../lib/structureEnums'
import { formatUnitOptionLabel } from '../../../lib/unitLabels'

export function VehiclesPage() {
  const propertyId = usePropertyId()
  const [drawer, setDrawer] = useState<'create' | Vehicle | null>(null)
  const invalidate = useInvalidate([
    'vehicles',
    'parking-vehicles',
    'linkable-vehicles',
    'vehicle-parking-occupancy',
  ])
  const list = usePagedListState('plate', {
    columnFilters: { horizontalPropertyId: propertyId },
  })
  const listQuery = usePagedListQuery<Vehicle>('vehicles', '/api/Vehicles', list)

  const parkings = useEntityOptions<Unit>('parking-unit-options', '/api/Units', {
    horizontalPropertyId: propertyId,
    unitType: 'Parking',
  })
  const { buildingById } = useBuildingById(propertyId)
  const brands = useEntityOptions<VehicleBrand>('vehicle-brand-options', '/api/VehicleBrands')

  const occupancyQuery = useQuery({
    queryKey: ['vehicle-parking-occupancy', propertyId],
    queryFn: async () => {
      const url = buildListUrl('/api/Vehicles', {
        page: 1,
        pageSize: 500,
        sortBy: 'plate',
        sortDir: 'asc',
        search: '',
        includeInactive: false,
        columnFilters: { horizontalPropertyId: propertyId },
      })
      const { data } = await api.get<PagedResult<Vehicle>>(url)
      const counts = new Map<string, number>()
      for (const v of data.items) {
        if (!v.unitId) continue
        counts.set(v.unitId, (counts.get(v.unitId) ?? 0) + 1)
      }
      return counts
    },
  })

  useEffect(() => {
    list.setFilter('horizontalPropertyId', propertyId)
  }, [propertyId, list.setFilter])

  const parkingCapacity = (u: Unit) => (u.isDoubleParking ? 2 : 1)

  const parkingOptions = useMemo(() => {
    const counts = occupancyQuery.data ?? new Map<string, number>()
    const currentUnitId =
      drawer !== null && drawer !== 'create' ? drawer.unitId : null
    return (parkings.data ?? [])
      .filter((u) => {
        if (currentUnitId && u.id === currentUnitId) return true
        const occupied = counts.get(u.id) ?? 0
        // When editing, current vehicle still counts in occupancy — free one slot for itself.
        const editingSameParking =
          drawer !== null && drawer !== 'create' && drawer.unitId === u.id
        const effective = editingSameParking ? Math.max(0, occupied - 1) : occupied
        return effective < parkingCapacity(u)
      })
      .map((u) => {
        const occupied = counts.get(u.id) ?? 0
        const cap = parkingCapacity(u)
        const base = formatUnitOptionLabel(u, buildingById)
        return {
          value: u.id,
          label: `${base} · ${occupied}/${cap}${u.isDoubleParking ? ' doble' : ''}`,
        }
      })
  }, [parkings.data, occupancyQuery.data, drawer, buildingById])

  const brandOptions = useMemo(
    () => (brands.data ?? []).map((b) => ({ value: b.id, label: b.name })),
    [brands.data],
  )

  const form = useForm({
    initialValues: {
      linkToParking: true,
      unitId: null as string | null,
      vehicleBrandId: '',
      vehicleType: 'Car',
      model: '',
      color: '',
      plate: '',
      isActive: true,
    },
    validate: {
      unitId: (v, values) => (values.linkToParking && !v ? 'Selecciona un parqueadero' : null),
      vehicleBrandId: (v) => (!v ? 'Obligatorio' : null),
      model: (v) => (!v.trim() ? 'Obligatorio' : null),
      color: (v) => (!v.trim() ? 'Obligatorio' : null),
      plate: (v) => (!v.trim() ? 'Obligatorio' : null),
    },
  })

  const openCreate = () => {
    form.setValues({
      linkToParking: true,
      unitId: parkingOptions[0]?.value ?? null,
      vehicleBrandId: '',
      vehicleType: 'Car',
      model: '',
      color: '',
      plate: '',
      isActive: true,
    })
    setDrawer('create')
  }

  const openEdit = (item: Vehicle) => {
    form.setValues({
      linkToParking: !!item.unitId,
      unitId: item.unitId,
      vehicleBrandId: item.vehicleBrandId,
      vehicleType: String(item.vehicleType),
      model: item.model,
      color: item.color,
      plate: item.plate,
      isActive: item.isActive,
    })
    setDrawer(item)
  }

  const saveMutation = useMutation({
    mutationFn: async () => {
      const payload = {
        horizontalPropertyId: propertyId,
        unitId: form.values.linkToParking ? form.values.unitId : null,
        vehicleBrandId: form.values.vehicleBrandId,
        vehicleType: form.values.vehicleType,
        model: form.values.model.trim(),
        color: form.values.color.trim(),
        plate: form.values.plate.trim(),
      }
      if (drawer === 'create') {
        const { data } = await api.post<Vehicle>('/api/Vehicles', payload)
        return data
      }
      const { data } = await api.put<Vehicle>(`/api/Vehicles/${drawer!.id}`, {
        ...payload,
        isActive: form.values.isActive,
      })
      return data
    },
    onSuccess: () => {
      notifications.show({ title: 'Guardado', message: 'Vehículo guardado', color: 'teal' })
      setDrawer(null)
      invalidate()
    },
    onError: (err) =>
      notifications.show({ title: 'Error', message: getApiErrorMessage(err), color: 'red' }),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/api/Vehicles/${id}`),
    onSuccess: () => {
      notifications.show({ title: 'Desactivado', message: 'Vehículo desactivado', color: 'gray' })
      invalidate()
    },
    onError: (err) =>
      notifications.show({ title: 'Error', message: getApiErrorMessage(err), color: 'red' }),
  })

  const columns = useMemo((): ColumnDef<Vehicle>[] => {
    return [
      {
        key: 'plate',
        header: 'Placa',
        sortKey: 'plate',
        filter: 'text',
        filterKey: 'plate',
        render: (row) => (
          <Text size="sm" fw={600}>
            {row.plate}
          </Text>
        ),
      },
      {
        key: 'vehicleType',
        header: 'Tipo',
        sortKey: 'vehicletype',
        filter: 'none',
        render: (row) => (
          <Badge size="sm" variant="light">
            {labelForOption(VEHICLE_TYPE_OPTIONS, row.vehicleType)}
          </Badge>
        ),
      },
      {
        key: 'brand',
        header: 'Marca / modelo',
        sortKey: 'brand',
        filter: 'none',
        render: (row) => `${row.brand} ${row.model}`,
      },
      {
        key: 'color',
        header: 'Color',
        filter: 'none',
        render: (row) => row.color,
      },
      {
        key: 'unitCode',
        header: 'Parqueadero',
        filter: 'none',
        render: (row) => row.unitCode ?? 'Sin asignar',
      },
      activeColumn<Vehicle>(),
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
                if (window.confirm(`¿Desactivar el vehículo ${row.plate}?`)) {
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
        title="Vehículos"
        description="Carros y motos de la propiedad. Puedes crearlos aquí y asociarlos luego a un parqueadero."
      />
      <ListToolbar
        onAdd={openCreate}
        addLabel="Agregar vehículo"
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
            title={item.plate}
            subtitle={`${labelForOption(VEHICLE_TYPE_OPTIONS, item.vehicleType)} · ${item.brand} ${item.model} · ${item.unitCode ?? 'Sin asignar'}`}
            inactive={!item.isActive}
            onEdit={() => openEdit(item)}
            onDelete={() => {
              if (window.confirm(`¿Desactivar el vehículo ${item.plate}?`)) {
                deleteMutation.mutate(item.id)
              }
            }}
          />
        )}
      />

      <FormDrawer
        opened={drawer !== null}
        onClose={() => setDrawer(null)}
        title={drawer === 'create' ? 'Nuevo vehículo' : 'Editar vehículo'}
      >
        <form onSubmit={form.onSubmit(() => saveMutation.mutate())}>
          <Stack gap="sm">
            <Select
              label="Tipo"
              data={VEHICLE_TYPE_OPTIONS.map((o) => ({ value: o.value, label: o.label }))}
              required
              {...form.getInputProps('vehicleType')}
            />
            <Select
              label="Marca"
              placeholder="Seleccione una"
              data={brandOptions}
              required
              searchable
              clearable
              nothingFoundMessage="Crea marcas en Catálogos → Marcas de vehículos"
              comboboxProps={formDrawerSelectComboboxProps}
              value={form.values.vehicleBrandId || null}
              onChange={(v) => form.setFieldValue('vehicleBrandId', v ?? '')}
              error={form.errors.vehicleBrandId}
            />
            <TextInput label="Modelo" required {...form.getInputProps('model')} />
            <TextInput label="Color" required {...form.getInputProps('color')} />
            <TextInput label="Placa" required {...form.getInputProps('plate')} />

            <Divider label="Parqueadero" labelPosition="center" />
            <Switch
              label="Vincular a un parqueadero"
              description="Asocia este vehículo a un cupo de parqueo al guardar."
              {...form.getInputProps('linkToParking', { type: 'checkbox' })}
              onChange={(e) => {
                const checked = e.currentTarget.checked
                form.setFieldValue('linkToParking', checked)
                if (checked && !form.values.unitId) {
                  form.setFieldValue('unitId', parkingOptions[0]?.value ?? null)
                }
                if (!checked) {
                  form.setFieldValue('unitId', null)
                }
              }}
            />
            {form.values.linkToParking && (
              <Select
                label="Parqueadero"
                placeholder={parkings.isLoading ? 'Cargando…' : 'Selecciona parqueadero'}
                data={parkingOptions}
                required
                searchable
                nothingFoundMessage="No hay parqueaderos"
                comboboxProps={formDrawerSelectComboboxProps}
                value={form.values.unitId}
                onChange={(v) => form.setFieldValue('unitId', v)}
                error={form.errors.unitId}
              />
            )}

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
