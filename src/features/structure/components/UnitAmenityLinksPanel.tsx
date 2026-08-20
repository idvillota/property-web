import {
  ActionIcon,
  Badge,
  Button,
  Divider,
  Group,
  Loader,
  Select,
  Stack,
  Text,
  Tooltip,
} from '@mantine/core'
import { notifications } from '@mantine/notifications'
import { IconLink, IconUnlink } from '@tabler/icons-react'
import { useMutation, useQuery } from '@tanstack/react-query'
import { useMemo, useState } from 'react'
import { api } from '../../../api/client'
import { getApiErrorMessage } from '../../../api/errors'
import { buildListUrl, type PagedResult } from '../../../api/paging'
import type { Unit, UnitAmenityLink, UnitHousehold } from '../../../api/types'
import { useBuildingById } from '../../../hooks/useBuildingById'
import { formatUnitOptionLabel } from '../../../lib/unitLabels'
import { normalizeUnitType } from '../../../lib/structureEnums'

type AmenityKind = 'Parking' | 'Terrace' | 'Storage'

const KIND_LABEL: Record<AmenityKind, string> = {
  Parking: 'Parqueaderos',
  Terrace: 'Terrazas',
  Storage: 'Bodegas',
}

const KIND_SINGULAR: Record<AmenityKind, string> = {
  Parking: 'parqueadero',
  Terrace: 'terraza',
  Storage: 'bodega',
}

type Props = {
  propertyId: string
  dwelling: Unit
  household: UnitHousehold | undefined
  onChanged: () => void
}

async function putUnit(
  unit: Unit,
  patch: Partial<Pick<Unit, 'linkedUnitId' | 'parkingCount' | 'terraceCount' | 'storageCount'>>,
) {
  const { data } = await api.put<Unit>(`/api/Units/${unit.id}`, {
    horizontalPropertyId: unit.horizontalPropertyId,
    buildingId: unit.buildingId,
    floorId: unit.floorId,
    code: unit.code,
    unitType: unit.unitType,
    privateBuiltAreaM2: unit.privateBuiltAreaM2,
    privateOpenAreaM2: unit.privateOpenAreaM2,
    contributionModuleCode: unit.contributionModuleCode,
    linkedUnitId: patch.linkedUnitId !== undefined ? patch.linkedUnitId : unit.linkedUnitId,
    parkingCount: patch.parkingCount ?? unit.parkingCount ?? 0,
    terraceCount: patch.terraceCount ?? unit.terraceCount ?? 0,
    storageCount: patch.storageCount ?? unit.storageCount ?? 0,
    isDoubleParking: unit.isDoubleParking ?? false,
    isBillable: unit.isBillable,
    isPaymentUpToDate: unit.isPaymentUpToDate ?? true,
    isActive: unit.isActive,
  })
  return data
}

async function syncDwellingAmenityCounts(dwellingId: string) {
  const { data: household } = await api.get<UnitHousehold>(`/api/Units/${dwellingId}/household`)
  const { data: dwelling } = await api.get<Unit>(`/api/Units/${dwellingId}`)
  await putUnit(dwelling, {
    parkingCount: household.relatedParkings?.length ?? 0,
    terraceCount: household.relatedTerraces?.length ?? 0,
    storageCount: household.relatedStorages?.length ?? 0,
  })
}

function useAmenityUnits(propertyId: string, kind: AmenityKind) {
  return useQuery({
    queryKey: ['amenity-units', propertyId, kind],
    queryFn: async () => {
      const url = buildListUrl('/api/Units', {
        page: 1,
        pageSize: 100,
        sortBy: 'code',
        sortDir: 'asc',
        search: '',
        includeInactive: false,
        columnFilters: {
          horizontalPropertyId: propertyId,
          unitType: kind,
        },
      })
      const { data } = await api.get<PagedResult<Unit>>(url)
      return data.items
    },
  })
}

function AmenityKindSection({
  kind,
  propertyId,
  dwelling,
  household: _household,
  linked,
  onChanged,
}: {
  kind: AmenityKind
  propertyId: string
  dwelling: Unit
  household: UnitHousehold
  linked: UnitAmenityLink[]
  onChanged: () => void
}) {
  const [pickId, setPickId] = useState<string | null>(null)
  const amenitiesQuery = useAmenityUnits(propertyId, kind)
  const { buildingById } = useBuildingById(propertyId)

  const availableOptions = useMemo(() => {
    const linkedIds = new Set(linked.map((l) => l.unitId))
    return (amenitiesQuery.data ?? [])
      .filter((u) => !u.linkedUnitId && !linkedIds.has(u.id))
      .map((u) => ({ value: u.id, label: formatUnitOptionLabel(u, buildingById) }))
  }, [amenitiesQuery.data, linked, buildingById])

  const linkMutation = useMutation({
    mutationFn: async (amenityId: string) => {
      const amenity = (amenitiesQuery.data ?? []).find((u) => u.id === amenityId)
      if (!amenity) throw new Error('Unidad no encontrada')
      await putUnit(amenity, { linkedUnitId: dwelling.id })
      await syncDwellingAmenityCounts(dwelling.id)
    },
    onSuccess: () => {
      notifications.show({
        title: 'Vinculado',
        message: `${KIND_SINGULAR[kind]} asignado a ${dwelling.code}`,
        color: 'teal',
      })
      setPickId(null)
      onChanged()
    },
    onError: (err) =>
      notifications.show({ title: 'Error', message: getApiErrorMessage(err), color: 'red' }),
  })

  const unlinkMutation = useMutation({
    mutationFn: async (amenityId: string) => {
      const amenity = (amenitiesQuery.data ?? []).find((u) => u.id === amenityId)
      if (!amenity) throw new Error('Unidad no encontrada')
      await putUnit(amenity, { linkedUnitId: null })
      await syncDwellingAmenityCounts(dwelling.id)
    },
    onSuccess: () => {
      notifications.show({ title: 'Desvinculado', message: 'Relación eliminada', color: 'teal' })
      onChanged()
    },
    onError: (err) =>
      notifications.show({ title: 'Error', message: getApiErrorMessage(err), color: 'red' }),
  })

  return (
    <Stack gap={6}>
      <Text size="xs" c="dimmed" tt="uppercase" fw={600}>
        {KIND_LABEL[kind]}
      </Text>
      {amenitiesQuery.isLoading ? (
        <Loader size="sm" />
      ) : amenitiesQuery.isError ? (
        <Text size="sm" c="red">
          {getApiErrorMessage(amenitiesQuery.error)}
        </Text>
      ) : linked.length > 0 ? (
        linked.map((link) => (
          <Group key={link.unitId} justify="space-between" wrap="nowrap">
            <Badge variant="light" color="gray">
              {link.code}
            </Badge>
            <Tooltip label="Quitar vínculo">
              <ActionIcon
                variant="subtle"
                color="red"
                size="sm"
                loading={unlinkMutation.isPending}
                onClick={() => unlinkMutation.mutate(link.unitId)}
                aria-label="Desvincular"
              >
                <IconUnlink size={14} />
              </ActionIcon>
            </Tooltip>
          </Group>
        ))
      ) : (
        <Text size="sm" c="dimmed">
          Ninguno vinculado
        </Text>
      )}

      {availableOptions.length > 0 ? (
        <Group align="flex-end" gap="xs">
          <Select
            style={{ flex: 1 }}
            label={`Vincular ${KIND_SINGULAR[kind]} existente`}
            placeholder="Seleccionar…"
            data={availableOptions}
            value={pickId}
            onChange={setPickId}
            searchable
          />
          <Button
            color="teal"
            leftSection={<IconLink size={14} />}
            disabled={!pickId}
            loading={linkMutation.isPending}
            onClick={() => pickId && linkMutation.mutate(pickId)}
          >
            Vincular
          </Button>
        </Group>
      ) : (
        !amenitiesQuery.isLoading &&
        !amenitiesQuery.isError && (
          <Text size="xs" c="dimmed">
            No hay {KIND_LABEL[kind].toLowerCase()} libres. Agrégalos en el alta inicial o con +
            Unidad.
          </Text>
        )
      )}
    </Stack>
  )
}

/** Link parking / terrace / storage units to a dwelling (apartment or house only). */
export function UnitAmenityLinksPanel({ propertyId, dwelling, household, onChanged }: Props) {
  const dwellingType = normalizeUnitType(dwelling.unitType)
  if (dwellingType !== 'Apartment' && dwellingType !== 'House') {
    return null
  }

  if (!household) {
    return <Loader size="sm" />
  }

  return (
    <Stack gap="md">
      <Divider label="Amenidades vinculadas" labelPosition="center" />
      <Text size="xs" c="dimmed">
        Solo apartamentos y casas pueden tener parqueaderos, terrazas o bodegas vinculados.
      </Text>
      <AmenityKindSection
        kind="Parking"
        propertyId={propertyId}
        dwelling={dwelling}
        household={household}
        linked={household.relatedParkings ?? []}
        onChanged={onChanged}
      />
      <AmenityKindSection
        kind="Terrace"
        propertyId={propertyId}
        dwelling={dwelling}
        household={household}
        linked={household.relatedTerraces ?? []}
        onChanged={onChanged}
      />
      <AmenityKindSection
        kind="Storage"
        propertyId={propertyId}
        dwelling={dwelling}
        household={household}
        linked={household.relatedStorages ?? []}
        onChanged={onChanged}
      />
    </Stack>
  )
}

type HostLinkProps = {
  propertyId: string
  amenity: Unit
  onChanged: () => void
}

/** From a parking/terrace/storage unit, choose which apartment/house it belongs to. */
export function UnitHostLinkField({ propertyId, amenity, onChanged }: HostLinkProps) {
  const kind = normalizeUnitType(amenity.unitType) as AmenityKind | null
  const { buildingById } = useBuildingById(propertyId)
  const dwellingsQuery = useQuery({
    queryKey: ['dwelling-units', propertyId],
    queryFn: async () => {
      const [apts, houses] = await Promise.all(
        (['Apartment', 'House'] as const).map(async (unitType) => {
          const url = buildListUrl('/api/Units', {
            page: 1,
            pageSize: 100,
            sortBy: 'code',
            sortDir: 'asc',
            search: '',
            includeInactive: false,
            columnFilters: { horizontalPropertyId: propertyId, unitType },
          })
          const { data } = await api.get<PagedResult<Unit>>(url)
          return data.items
        }),
      )
      return [...apts, ...houses].sort((a, b) => a.code.localeCompare(b.code))
    },
  })

  const options = useMemo(
    () =>
      (dwellingsQuery.data ?? []).map((u) => {
        const base = formatUnitOptionLabel(u, buildingById)
        const kindLabel = normalizeUnitType(u.unitType) === 'House' ? 'Casa' : 'Apto'
        return { value: u.id, label: `${base} · ${kindLabel}` }
      }),
    [dwellingsQuery.data, buildingById],
  )

  const saveMutation = useMutation({
    mutationFn: async (linkedUnitId: string | null) => {
      const previousHostId = amenity.linkedUnitId
      await putUnit(amenity, { linkedUnitId })
      if (previousHostId) await syncDwellingAmenityCounts(previousHostId)
      if (linkedUnitId) await syncDwellingAmenityCounts(linkedUnitId)
    },
    onSuccess: () => {
      notifications.show({ title: 'Guardado', message: 'Vínculo actualizado', color: 'teal' })
      onChanged()
    },
    onError: (err) =>
      notifications.show({ title: 'Error', message: getApiErrorMessage(err), color: 'red' }),
  })

  if (kind !== 'Parking' && kind !== 'Terrace' && kind !== 'Storage') {
    return null
  }

  return (
    <Stack gap={6}>
      <Divider label="Unidad asociada" labelPosition="center" />
      <Select
        label="Apartamento / casa"
        description={`Este ${KIND_SINGULAR[kind]} solo puede asociarse a un apartamento o casa.`}
        placeholder="Sin asignar"
        data={options}
        value={amenity.linkedUnitId}
        onChange={(v) => saveMutation.mutate(v)}
        searchable
        clearable
        disabled={dwellingsQuery.isLoading || saveMutation.isPending}
      />
    </Stack>
  )
}
