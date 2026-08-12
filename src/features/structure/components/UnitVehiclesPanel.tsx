import {
  ActionIcon,
  Badge,
  Button,
  Divider,
  Group,
  Loader,
  Select,
  Stack,
  Switch,
  Text,
  TextInput,
  Tooltip,
} from '@mantine/core'
import { useForm } from '@mantine/form'
import { notifications } from '@mantine/notifications'
import { IconLink, IconPencil, IconPlus, IconTrash, IconUnlink } from '@tabler/icons-react'
import { useMutation, useQuery } from '@tanstack/react-query'
import { useMemo, useState } from 'react'
import { api } from '../../../api/client'
import { getApiErrorMessage } from '../../../api/errors'
import { buildListUrl, type PagedResult } from '../../../api/paging'
import type { Vehicle, VehicleBrand } from '../../../api/types'
import { FormDrawer } from '../../../components/crud/FormDrawer'
import { useEntityOptions } from '../../../hooks/useEntityOptions'
import { useInvalidate } from '../../../hooks/useInvalidate'
import { formDrawerSelectComboboxProps } from '../../../lib/formDrawerSelect'
import { labelForOption, VEHICLE_TYPE_OPTIONS } from '../../../lib/structureEnums'

type Props = {
  propertyId: string
  parkingUnitId: string
  parkingCode: string
  isDoubleParking: boolean
}

type DrawerState = 'create' | 'link' | Vehicle | null

function parkingCapacity(isDouble: boolean) {
  return isDouble ? 2 : 1
}

export function UnitVehiclesPanel({
  propertyId,
  parkingUnitId,
  parkingCode,
  isDoubleParking,
}: Props) {
  const capacity = parkingCapacity(isDoubleParking)
  const invalidate = useInvalidate(['vehicles', 'parking-vehicles', 'linkable-vehicles'])
  const [drawer, setDrawer] = useState<DrawerState>(null)
  const [linkVehicleId, setLinkVehicleId] = useState<string | null>(null)

  const listQuery = useQuery({
    queryKey: ['parking-vehicles', parkingUnitId],
    queryFn: async () => {
      const url = buildListUrl('/api/Vehicles', {
        page: 1,
        pageSize: 100,
        sortBy: 'plate',
        sortDir: 'asc',
        search: '',
        includeInactive: false,
        columnFilters: { unitId: parkingUnitId },
      })
      const { data } = await api.get<PagedResult<Vehicle>>(url)
      return data.items
    },
  })

  const linkableQuery = useQuery({
    queryKey: ['linkable-vehicles', propertyId, parkingUnitId],
    enabled: drawer === 'link',
    queryFn: async () => {
      const url = buildListUrl('/api/Vehicles', {
        page: 1,
        pageSize: 200,
        sortBy: 'plate',
        sortDir: 'asc',
        search: '',
        includeInactive: false,
        columnFilters: {
          horizontalPropertyId: propertyId,
          excludeUnitId: parkingUnitId,
        },
      })
      const { data } = await api.get<PagedResult<Vehicle>>(url)
      return data.items
    },
  })

  const brands = useEntityOptions<VehicleBrand>('vehicle-brand-options', '/api/VehicleBrands')
  const brandOptions = useMemo(
    () => (brands.data ?? []).map((b) => ({ value: b.id, label: b.name })),
    [brands.data],
  )

  const linkOptions = useMemo(
    () =>
      (linkableQuery.data ?? []).map((v) => ({
        value: v.id,
        label: `${v.plate} · ${v.brand} ${v.model}${v.unitCode ? ` (${v.unitCode})` : ' (sin parqueadero)'}`,
      })),
    [linkableQuery.data],
  )

  const form = useForm({
    initialValues: {
      linkToParking: true,
      vehicleType: 'Car',
      vehicleBrandId: '',
      model: '',
      color: '',
      plate: '',
      isActive: true,
    },
    validate: {
      vehicleBrandId: (v) => (!v ? 'Obligatorio' : null),
      model: (v) => (!v.trim() ? 'Obligatorio' : null),
      color: (v) => (!v.trim() ? 'Obligatorio' : null),
      plate: (v) => (!v.trim() ? 'Obligatorio' : null),
    },
  })

  const openCreate = () => {
    form.setValues({
      linkToParking: true,
      vehicleType: 'Car',
      vehicleBrandId: '',
      model: '',
      color: '',
      plate: '',
      isActive: true,
    })
    setDrawer('create')
  }

  const openLink = () => {
    setLinkVehicleId(null)
    setDrawer('link')
  }

  const openEdit = (item: Vehicle) => {
    form.setValues({
      linkToParking: true,
      vehicleType: String(item.vehicleType),
      vehicleBrandId: item.vehicleBrandId,
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
        unitId: form.values.linkToParking ? parkingUnitId : null,
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
      const { data } = await api.put<Vehicle>(`/api/Vehicles/${(drawer as Vehicle).id}`, {
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

  const linkMutation = useMutation({
    mutationFn: async (vehicleId: string) => {
      const { data } = await api.post<Vehicle>(`/api/Vehicles/${vehicleId}/assign-unit`, {
        unitId: parkingUnitId,
      })
      return data
    },
    onSuccess: () => {
      notifications.show({ title: 'Asociado', message: 'Vehículo vinculado al parqueadero', color: 'teal' })
      setDrawer(null)
      setLinkVehicleId(null)
      invalidate()
    },
    onError: (err) =>
      notifications.show({ title: 'Error', message: getApiErrorMessage(err), color: 'red' }),
  })

  const unassignMutation = useMutation({
    mutationFn: (id: string) => api.post(`/api/Vehicles/${id}/unassign-unit`),
    onSuccess: () => {
      notifications.show({ title: 'Desvinculado', message: 'Vehículo quitado del parqueadero', color: 'gray' })
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

  const occupied = listQuery.data?.length ?? 0
  const isFull = occupied >= capacity

  return (
    <Stack gap="sm">
      <Divider label="Vehículos" labelPosition="center" />
      <Group justify="space-between" align="center">
        <Stack gap={2}>
          <Text size="xs" c="dimmed">
            Carros y motos asociados a {parkingCode}
          </Text>
          <Badge size="xs" variant="light" color={isFull ? 'orange' : 'teal'} w="fit-content">
            {occupied}/{capacity} · {isDoubleParking ? 'Doble' : 'Sencillo'}
          </Badge>
        </Stack>
        <Group gap={6}>
          <Button
            size="compact-xs"
            variant="light"
            leftSection={<IconLink size={12} />}
            onClick={openLink}
            disabled={isFull}
          >
            Asociar
          </Button>
          <Button
            size="compact-xs"
            variant="light"
            color="teal"
            leftSection={<IconPlus size={12} />}
            onClick={openCreate}
            disabled={isFull}
          >
            Nuevo
          </Button>
        </Group>
      </Group>
      {isFull && (
        <Text size="xs" c="dimmed">
          Cupo completo. {isDoubleParking ? '' : 'Márcalo como parqueadero doble para un segundo vehículo.'}
        </Text>
      )}

      {listQuery.isLoading ? (
        <Loader size="sm" />
      ) : listQuery.isError ? (
        <Text size="sm" c="red">
          {getApiErrorMessage(listQuery.error)}
        </Text>
      ) : (listQuery.data?.length ?? 0) === 0 ? (
        <Text size="sm" c="dimmed">
          Sin vehículos. Asocia uno existente o crea uno nuevo.
        </Text>
      ) : (
        <Stack gap={6}>
          {listQuery.data!.map((v) => (
            <Group
              key={v.id}
              justify="space-between"
              wrap="nowrap"
              p="sm"
              style={{
                borderRadius: 8,
                border: '1px solid var(--mantine-color-gray-3)',
              }}
            >
              <Stack gap={2} style={{ minWidth: 0 }}>
                <Group gap={6}>
                  <Text size="sm" fw={700}>
                    {v.plate}
                  </Text>
                  <Badge size="xs" variant="light">
                    {labelForOption(VEHICLE_TYPE_OPTIONS, v.vehicleType)}
                  </Badge>
                </Group>
                <Text size="xs" c="dimmed" lineClamp={1}>
                  {v.brand} {v.model} · {v.color}
                </Text>
              </Stack>
              <Group gap={4} wrap="nowrap">
                <Tooltip label="Editar">
                  <ActionIcon variant="subtle" color="teal" onClick={() => openEdit(v)}>
                    <IconPencil size={14} />
                  </ActionIcon>
                </Tooltip>
                <Tooltip label="Desvincular">
                  <ActionIcon
                    variant="subtle"
                    color="orange"
                    onClick={() => {
                      if (window.confirm(`¿Quitar ${v.plate} de este parqueadero?`)) {
                        unassignMutation.mutate(v.id)
                      }
                    }}
                  >
                    <IconUnlink size={14} />
                  </ActionIcon>
                </Tooltip>
                <Tooltip label="Desactivar">
                  <ActionIcon
                    variant="subtle"
                    color="red"
                    onClick={() => {
                      if (window.confirm(`¿Desactivar el vehículo ${v.plate}?`)) {
                        deleteMutation.mutate(v.id)
                      }
                    }}
                  >
                    <IconTrash size={14} />
                  </ActionIcon>
                </Tooltip>
              </Group>
            </Group>
          ))}
        </Stack>
      )}

      <FormDrawer
        opened={drawer === 'link'}
        onClose={() => setDrawer(null)}
        title="Asociar vehículo existente"
      >
        <Stack gap="sm">
          <Text size="sm" c="dimmed">
            Elige un vehículo de la propiedad (sin parqueadero o en otro parqueadero).
          </Text>
          <Select
            label="Vehículo"
            placeholder={linkableQuery.isLoading ? 'Cargando…' : 'Buscar por placa'}
            data={linkOptions}
            searchable
            nothingFoundMessage="No hay vehículos disponibles"
            value={linkVehicleId}
            onChange={setLinkVehicleId}
            comboboxProps={formDrawerSelectComboboxProps}
          />
          <Button
            fullWidth
            disabled={!linkVehicleId}
            loading={linkMutation.isPending}
            onClick={() => linkVehicleId && linkMutation.mutate(linkVehicleId)}
          >
            Asociar a {parkingCode}
          </Button>
        </Stack>
      </FormDrawer>

      <FormDrawer
        opened={drawer === 'create' || (drawer !== null && drawer !== 'link' && typeof drawer === 'object')}
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
            <Switch
              label={`Vincular a ${parkingCode}`}
              description="Si está activo, el vehículo queda asociado a este parqueadero."
              {...form.getInputProps('linkToParking', { type: 'checkbox' })}
            />
            <Button type="submit" fullWidth loading={saveMutation.isPending}>
              Guardar
            </Button>
          </Stack>
        </form>
      </FormDrawer>
    </Stack>
  )
}
