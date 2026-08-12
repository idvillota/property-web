import {
  ActionIcon,
  Badge,
  Box,
  Button,
  Divider,
  Group,
  Loader,
  Menu,
  NumberInput,
  Paper,
  ScrollArea,
  SegmentedControl,
  Select,
  SimpleGrid,
  Stack,
  Switch,
  Text,
  TextInput,
  Tooltip,
  UnstyledButton,
} from '@mantine/core'
import { notifications } from '@mantine/notifications'
import { IconBox, IconCar, IconPlus, IconSun } from '@tabler/icons-react'
import { useMutation, useQuery } from '@tanstack/react-query'
import { useEffect, useMemo, useState } from 'react'
import { api } from '../../../api/client'
import { getApiErrorMessage } from '../../../api/errors'
import type {
  Building,
  Floor,
  StructureComposerCommitResult,
  StructureComposerRequest,
  StructureWorkspace,
  Unit,
  UnitHousehold,
} from '../../../api/types'
import { PageHeader } from '../../../components/shared/PageHeader'
import { useInvalidate } from '../../../hooks/useInvalidate'
import { usePropertyId } from '../../../hooks/usePropertyId'
import { labelForOption, normalizeUnitType, UNIT_TYPE_OPTIONS } from '../../../lib/structureEnums'
import {
  UnitAmenityLinksPanel,
  UnitHostLinkField,
} from '../components/UnitAmenityLinksPanel'
import { UnitPersonasPanel } from '../components/UnitPersonasPanel'
import { UnitVehiclesPanel } from '../components/UnitVehiclesPanel'

function isDwellingUnit(unitType: string | number | null | undefined) {
  const t = normalizeUnitType(unitType)
  return t === 'Apartment' || t === 'House'
}

/** Units that can have an owner assigned (dwellings + parking). */
function canAssignOwner(unitType: string | number | null | undefined) {
  const t = normalizeUnitType(unitType)
  return t === 'Apartment' || t === 'House' || t === 'Parking'
}

function isLinkableAmenity(unitType: string | number | null | undefined) {
  const t = normalizeUnitType(unitType)
  return t === 'Parking' || t === 'Terrace' || t === 'Storage'
}

type DraftUnit = {
  key: string
  index: number
  code: string
  enabled: boolean
  areaM2: number
  parkingCount: number
  terraceCount: number
  storageCount: number
}

type DraftFloor = {
  key: string
  number: number
  name: string
  units: DraftUnit[]
}

type DraftBuilding = {
  key: string
  name: string
  code: string
  floors: DraftFloor[]
}

function unitCode(floor: number, index: number) {
  return `${floor}${String(index).padStart(2, '0')}`
}

function makeFloor(number: number, unitsPerFloor: number, areaM2: number): DraftFloor {
  return {
    key: `f-${number}-${Math.random().toString(36).slice(2, 7)}`,
    number,
    name: `Piso ${number}`,
    units: Array.from({ length: unitsPerFloor }, (_, i) => ({
      key: `u-${number}-${i + 1}-${Math.random().toString(36).slice(2, 7)}`,
      index: i + 1,
      code: unitCode(number, i + 1),
      enabled: true,
      areaM2,
      parkingCount: 0,
      terraceCount: 0,
      storageCount: 0,
    })),
  }
}

function makeBuilding(
  ordinal: number,
  floors: number,
  unitsPerFloor: number,
  areaM2: number,
): DraftBuilding {
  const code = String.fromCharCode(64 + ordinal)
  return {
    key: `b-${ordinal}-${Math.random().toString(36).slice(2, 7)}`,
    name: `Torre ${code}`,
    code,
    floors: Array.from({ length: floors }, (_, i) => makeFloor(i + 1, unitsPerFloor, areaM2)),
  }
}

function resizeDraft(
  prev: DraftBuilding[],
  buildingCount: number,
  floorCount: number,
  unitsPerFloor: number,
  areaM2: number,
): DraftBuilding[] {
  const next = prev.slice(0, buildingCount).map((b) => {
    let floors = b.floors.slice(0, floorCount)
    while (floors.length < floorCount) {
      floors = [...floors, makeFloor(floors.length + 1, unitsPerFloor, areaM2)]
    }
    floors = floors.map((f) => {
      let units = f.units.slice(0, unitsPerFloor)
      while (units.length < unitsPerFloor) {
        const index = units.length + 1
        units = [
          ...units,
          {
            key: `u-${f.number}-${index}-${Math.random().toString(36).slice(2, 7)}`,
            index,
            code: unitCode(f.number, index),
            enabled: true,
            areaM2,
            parkingCount: 0,
            terraceCount: 0,
            storageCount: 0,
          },
        ]
      }
      return { ...f, units }
    })
    return { ...b, floors }
  })
  while (next.length < buildingCount) {
    next.push(makeBuilding(next.length + 1, floorCount, unitsPerFloor, areaM2))
  }
  return next
}

function toCommitRequest(propertyId: string, matrix: DraftBuilding[]): StructureComposerRequest {
  const unitOverrides: StructureComposerRequest['unitOverrides'] = []

  for (const b of matrix) {
    for (const f of b.floors) {
      for (const u of f.units) {
        if (!u.enabled) {
          unitOverrides.push({ code: u.code, remove: true })
          continue
        }
        if (
          u.parkingCount > 0 ||
          u.terraceCount > 0 ||
          u.storageCount > 0 ||
          u.areaM2 !== 72
        ) {
          unitOverrides.push({
            code: u.code,
            areaM2: u.areaM2,
            parkingCount: u.parkingCount,
            terraceCount: u.terraceCount,
            storageCount: u.storageCount,
          })
        }
      }
    }
  }

  return {
    horizontalPropertyId: propertyId,
    buildings: matrix.map((b) => {
      const floors = b.floors.map((f) => f.number)
      return {
        name: b.name,
        code: b.code || null,
        floorFrom: Math.min(...floors),
        floorTo: Math.max(...floors),
        unitsPerFloor: Math.max(...b.floors.map((f) => f.units.length)),
        includeBasement: false,
        includeRooftop: false,
        codePattern: '{piso}{u:00}',
        defaultUnitType: 'Apartment',
        defaultAreaM2: 72,
      }
    }),
    parking: null,
    storage: null,
    unitOverrides,
  }
}

function UnitCell({
  code,
  areaLabel,
  selected,
  muted,
  parkingCount,
  terraceCount,
  storageCount,
  onClick,
}: {
  code: string
  areaLabel?: string
  selected?: boolean
  muted?: boolean
  parkingCount?: number
  terraceCount?: number
  storageCount?: number
  onClick?: () => void
}) {
  return (
    <UnstyledButton
      onClick={onClick}
      style={{
        minHeight: 64,
        borderRadius: 8,
        border: selected ? '1.5px solid var(--mantine-color-teal-6)' : '1px solid var(--mantine-color-gray-3)',
        background: muted
          ? 'var(--mantine-color-gray-1)'
          : selected
            ? 'var(--mantine-color-teal-0)'
            : 'var(--mantine-color-body)',
        opacity: muted ? 0.45 : 1,
        padding: 8,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 2,
      }}
    >
      <Text size="sm" fw={700}>
        {code}
      </Text>
      {areaLabel && !muted && (
        <Text size="xs" c="dimmed">
          {areaLabel}
        </Text>
      )}
      {!muted &&
        ((parkingCount ?? 0) > 0 || (terraceCount ?? 0) > 0 || (storageCount ?? 0) > 0) && (
          <Group gap={4} mt={2}>
            {(parkingCount ?? 0) > 0 && (
              <Tooltip label={`${parkingCount} parqueadero(s)`}>
                <Badge size="xs" variant="light" color="gray" leftSection={<IconCar size={10} />}>
                  {parkingCount}
                </Badge>
              </Tooltip>
            )}
            {(terraceCount ?? 0) > 0 && (
              <Tooltip label={`${terraceCount} terraza(s)`}>
                <Badge size="xs" variant="light" color="yellow" leftSection={<IconSun size={10} />}>
                  {terraceCount}
                </Badge>
              </Tooltip>
            )}
            {(storageCount ?? 0) > 0 && (
              <Tooltip label={`${storageCount} bodega(s)`}>
                <Badge size="xs" variant="light" color="grape" leftSection={<IconBox size={10} />}>
                  {storageCount}
                </Badge>
              </Tooltip>
            )}
          </Group>
        )}
    </UnstyledButton>
  )
}

function SetupMode({ propertyId }: { propertyId: string }) {
  const invalidate = useInvalidate([
    'structure-workspace',
    'structure-composer-status',
    'units',
    'buildings',
    'floors',
  ])
  const [buildingCount, setBuildingCount] = useState(2)
  const [floorCount, setFloorCount] = useState(5)
  const [unitsPerFloor, setUnitsPerFloor] = useState(4)
  const [defaultArea, setDefaultArea] = useState(72)
  const [matrix, setMatrix] = useState<DraftBuilding[]>(() =>
    resizeDraft([], 2, 5, 4, 72),
  )
  const [activeBuildingKey, setActiveBuildingKey] = useState(matrix[0]?.key ?? '')
  const [selectedUnitKey, setSelectedUnitKey] = useState<string | null>(null)

  const activeBuilding = matrix.find((b) => b.key === activeBuildingKey) ?? matrix[0] ?? null

  const selected = useMemo(() => {
    if (!activeBuilding || !selectedUnitKey) return null
    for (const f of activeBuilding.floors) {
      const u = f.units.find((x) => x.key === selectedUnitKey)
      if (u) return { floor: f, unit: u }
    }
    return null
  }, [activeBuilding, selectedUnitKey])

  const totals = useMemo(() => {
    const units = matrix.reduce(
      (s, b) => s + b.floors.reduce((fs, f) => fs + f.units.filter((u) => u.enabled).length, 0),
      0,
    )
    return {
      buildings: matrix.length,
      floors: matrix.reduce((s, b) => s + b.floors.length, 0),
      units,
    }
  }, [matrix])

  const applyCounts = (b: number, f: number, u: number) => {
    const nb = Math.max(1, Math.min(50, b))
    const nf = Math.max(1, Math.min(100, f))
    const nu = Math.max(1, Math.min(40, u))
    setBuildingCount(nb)
    setFloorCount(nf)
    setUnitsPerFloor(nu)
    setMatrix((prev) => {
      const next = resizeDraft(prev, nb, nf, nu, defaultArea)
      const keep = activeBuildingKey && next.some((x) => x.key === activeBuildingKey)
      queueMicrotask(() => setActiveBuildingKey(keep ? activeBuildingKey : (next[0]?.key ?? '')))
      return next
    })
  }

  const patchSelected = (patch: Partial<DraftUnit>) => {
    if (!activeBuilding || !selected) return
    setMatrix((prev) =>
      prev.map((b) => {
        if (b.key !== activeBuilding.key) return b
        return {
          ...b,
          floors: b.floors.map((f) => {
            if (f.key !== selected.floor.key) return f
            return {
              ...f,
              units: f.units.map((u) => (u.key === selected.unit.key ? { ...u, ...patch } : u)),
            }
          }),
        }
      }),
    )
  }

  const commitMutation = useMutation({
    mutationFn: async () => {
      const body = toCommitRequest(propertyId, matrix)
      const { data } = await api.post<StructureComposerCommitResult>(
        '/api/StructureComposer/commit',
        body,
      )
      return data
    },
    onSuccess: (data) => {
      notifications.show({
        title: 'Estructura creada',
        message: `${data.buildingsCreated} bloques · ${data.floorsCreated} pisos · ${data.unitsCreated} unidades`,
        color: 'teal',
      })
      invalidate()
    },
    onError: (err) =>
      notifications.show({ title: 'Error', message: getApiErrorMessage(err), color: 'red' }),
  })

  const cols = activeBuilding?.floors[0]?.units.length ?? unitsPerFloor

  return (
    <Stack gap="lg">
      <PageHeader
        title="Estructura"
        description="Define bloques, pisos y unidades. La planta se actualiza al instante."
      />

      <Box
        style={{
          display: 'grid',
          gap: 16,
          gridTemplateColumns: 'minmax(220px, 240px) minmax(0, 1fr) minmax(240px, 280px)',
        }}
      >
        <Paper withBorder p="md" radius="md">
          <Stack gap="sm">
            <Text fw={600} size="sm">
              Dimensiones
            </Text>
            <NumberInput
              label="Bloques"
              value={buildingCount}
              onChange={(v) => applyCounts(Number(v) || 1, floorCount, unitsPerFloor)}
              min={1}
              max={50}
            />
            <NumberInput
              label="Pisos por bloque"
              value={floorCount}
              onChange={(v) => applyCounts(buildingCount, Number(v) || 1, unitsPerFloor)}
              min={1}
              max={100}
            />
            <NumberInput
              label="Unidades por piso"
              value={unitsPerFloor}
              onChange={(v) => applyCounts(buildingCount, floorCount, Number(v) || 1)}
              min={1}
              max={40}
            />
            <NumberInput
              label="Área típica m²"
              value={defaultArea}
              onChange={(v) => setDefaultArea(Number(v) || 0)}
              min={0}
              decimalScale={2}
            />
            <Divider />
            <Group gap="xs">
              <Badge variant="light">{totals.buildings} bloques</Badge>
              <Badge variant="light">{totals.floors} pisos</Badge>
              <Badge variant="light" color="teal">
                {totals.units} unidades
              </Badge>
            </Group>
            <Button
              color="teal"
              loading={commitMutation.isPending}
              onClick={() => commitMutation.mutate()}
              disabled={totals.units < 1}
            >
              Crear {totals.units} unidades
            </Button>
          </Stack>
        </Paper>

        <Paper withBorder p="md" radius="md">
          <Stack gap="sm">
            <Group gap="xs">
              {matrix.map((b) => (
                <Button
                  key={b.key}
                  size="compact-sm"
                  variant={b.key === activeBuilding?.key ? 'filled' : 'light'}
                  color="teal"
                  onClick={() => {
                    setActiveBuildingKey(b.key)
                    setSelectedUnitKey(null)
                  }}
                >
                  {b.code || b.name}
                </Button>
              ))}
            </Group>
            {activeBuilding && (
              <>
                <Group grow>
                  <TextInput
                    label="Nombre del bloque"
                    value={activeBuilding.name}
                    onChange={(e) =>
                      setMatrix((prev) =>
                        prev.map((b) =>
                          b.key === activeBuilding.key ? { ...b, name: e.currentTarget.value } : b,
                        ),
                      )
                    }
                  />
                  <TextInput
                    label="Código"
                    value={activeBuilding.code}
                    onChange={(e) =>
                      setMatrix((prev) =>
                        prev.map((b) =>
                          b.key === activeBuilding.key ? { ...b, code: e.currentTarget.value } : b,
                        ),
                      )
                    }
                  />
                </Group>
                <Text size="xs" c="dimmed">
                  Clic en una celda para marcar parqueadero/terraza o excluirla del alta.
                </Text>
                <ScrollArea.Autosize mah={520}>
                  <Stack gap={6}>
                    {[...activeBuilding.floors]
                      .sort((a, b) => b.number - a.number)
                      .map((floor) => (
                        <Group key={floor.key} gap="sm" align="center" wrap="nowrap">
                          <Box w={48}>
                            <Text size="xs" c="dimmed" fw={600}>
                              P{floor.number}
                            </Text>
                          </Box>
                          <SimpleGrid cols={cols} spacing={6} style={{ flex: 1 }}>
                            {Array.from({ length: cols }, (_, i) => {
                              const unit = floor.units[i]
                              if (!unit) return <Box key={i} />
                              return (
                                <UnitCell
                                  key={unit.key}
                                  code={unit.code}
                                  areaLabel={`${unit.areaM2} m²`}
                                  selected={unit.key === selectedUnitKey}
                                  muted={!unit.enabled}
                                  parkingCount={unit.parkingCount}
                                  terraceCount={unit.terraceCount}
                                  storageCount={unit.storageCount}
                                  onClick={() => setSelectedUnitKey(unit.key)}
                                />
                              )
                            })}
                          </SimpleGrid>
                        </Group>
                      ))}
                  </Stack>
                </ScrollArea.Autosize>
              </>
            )}
          </Stack>
        </Paper>

        <Paper withBorder p="md" radius="md">
          {selected ? (
            <Stack gap="sm">
              <Text fw={700}>{selected.unit.code}</Text>
              <Text size="sm" c="dimmed">
                {activeBuilding?.name} · {selected.floor.name}
              </Text>
              <Switch
                label="Incluir en el alta"
                checked={selected.unit.enabled}
                onChange={(e) => patchSelected({ enabled: e.currentTarget.checked })}
              />
              <NumberInput
                label="Área m²"
                value={selected.unit.areaM2}
                onChange={(v) => patchSelected({ areaM2: Number(v) || 0 })}
                min={0}
                decimalScale={2}
                disabled={!selected.unit.enabled}
              />
              <Text size="xs" c="dimmed">
                Las amenidades (parqueadero, terraza, bodega) se vinculan después de crear la
                estructura.
              </Text>
            </Stack>
          ) : (
            <Stack gap="xs">
              <Text fw={600} size="sm">
                Unidad
              </Text>
              <Text size="sm" c="dimmed">
                Selecciona una celda en la planta para ajustar área, parqueadero o terraza.
              </Text>
            </Stack>
          )}
        </Paper>
      </Box>
    </Stack>
  )
}

function OperateMode({
  propertyId,
  workspace,
}: {
  propertyId: string
  workspace: StructureWorkspace
}) {
  const invalidate = useInvalidate([
    'structure-workspace',
    'structure-composer-status',
    'units',
    'buildings',
    'floors',
    'coefficient-summary',
    'unit-household',
    'amenity-units',
    'dwelling-units',
  ])
  const [buildingId, setBuildingId] = useState(workspace.buildings[0]?.id ?? '')
  const [floorId, setFloorId] = useState<string | 'all'>('all')
  const [selectedUnitId, setSelectedUnitId] = useState<string | null>(null)
  const [inspectorTab, setInspectorTab] = useState<'datos' | 'personas'>('datos')
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState({
    code: '',
    unitType: 'Apartment',
    privateBuiltAreaM2: 0,
    parkingCount: 0,
    terraceCount: 0,
    storageCount: 0,
    isDoubleParking: false,
    isBillable: true,
    isPaymentUpToDate: true,
    isActive: true,
  })

  const building = workspace.buildings.find((b) => b.id === buildingId) ?? workspace.buildings[0]
  const floors = building?.floors ?? []

  useEffect(() => {
    if (!building) return
    if (floorId !== 'all' && !floors.some((f) => f.id === floorId)) {
      setFloorId(floors[0]?.id ?? 'all')
    }
  }, [building, floorId, floors])

  const visibleFloors =
    floorId === 'all' ? [...floors].sort((a, b) => (b.number ?? 0) - (a.number ?? 0)) : floors.filter((f) => f.id === floorId)

  const selectedUnit = useMemo(() => {
    if (!selectedUnitId) return null
    for (const b of workspace.buildings) {
      for (const f of b.floors) {
        const u = f.units.find((x) => x.id === selectedUnitId)
        if (u) return { unit: u, floor: f, building: b }
      }
    }
    return null
  }, [workspace, selectedUnitId])

  const dwellingSelected = !!selectedUnit && isDwellingUnit(selectedUnit.unit.unitType)
  const personasAvailable = !!selectedUnit && canAssignOwner(selectedUnit.unit.unitType)
  const parkingSelected =
    !!selectedUnit && normalizeUnitType(selectedUnit.unit.unitType) === 'Parking'

  useEffect(() => {
    if (!selectedUnit) {
      setEditing(false)
      return
    }
    setDraft({
      code: selectedUnit.unit.code,
      unitType: String(selectedUnit.unit.unitType),
      privateBuiltAreaM2: selectedUnit.unit.privateBuiltAreaM2,
      parkingCount: selectedUnit.unit.parkingCount ?? 0,
      terraceCount: selectedUnit.unit.terraceCount ?? 0,
      storageCount: selectedUnit.unit.storageCount ?? 0,
      isDoubleParking: selectedUnit.unit.isDoubleParking ?? false,
      isBillable: selectedUnit.unit.isBillable,
      isPaymentUpToDate: selectedUnit.unit.isPaymentUpToDate ?? true,
      isActive: selectedUnit.unit.isActive,
    })
    setEditing(false)
    setInspectorTab('datos')
  }, [selectedUnit?.unit.id])

  useEffect(() => {
    if (!personasAvailable && inspectorTab === 'personas') {
      setInspectorTab('datos')
    }
  }, [personasAvailable, inspectorTab])

  const householdQuery = useQuery({
    queryKey: ['unit-household', selectedUnitId],
    enabled: !!selectedUnitId && personasAvailable,
    queryFn: async () => {
      const { data } = await api.get<UnitHousehold>(`/api/Units/${selectedUnitId}/household`)
      return data
    },
  })

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!selectedUnit) throw new Error('No unit')
      const { data } = await api.put<Unit>(`/api/Units/${selectedUnit.unit.id}`, {
        horizontalPropertyId: propertyId,
        buildingId: selectedUnit.unit.buildingId,
        floorId: selectedUnit.unit.floorId,
        code: draft.code.trim(),
        unitType: draft.unitType,
        privateBuiltAreaM2: draft.privateBuiltAreaM2,
        privateOpenAreaM2: selectedUnit.unit.privateOpenAreaM2,
        contributionModuleCode: selectedUnit.unit.contributionModuleCode,
        linkedUnitId: selectedUnit.unit.linkedUnitId,
        parkingCount: draft.parkingCount,
        terraceCount: draft.terraceCount,
        storageCount: draft.storageCount,
        isDoubleParking: draft.isDoubleParking,
        isBillable: draft.isBillable,
        isPaymentUpToDate: draft.isPaymentUpToDate,
        isActive: draft.isActive,
      })
      return data
    },
    onSuccess: () => {
      notifications.show({ title: 'Guardado', message: 'Unidad actualizada', color: 'teal' })
      setEditing(false)
      invalidate()
    },
    onError: (err) =>
      notifications.show({ title: 'Error', message: getApiErrorMessage(err), color: 'red' }),
  })

  const addBuildingMutation = useMutation({
    mutationFn: async () => {
      const n = workspace.buildings.length + 1
      const code = String.fromCharCode(64 + Math.min(n, 26))
      const { data } = await api.post<Building>('/api/Buildings', {
        horizontalPropertyId: propertyId,
        name: `Torre ${code}`,
        code,
        sortOrder: n,
      })
      return data
    },
    onSuccess: (data) => {
      notifications.show({ title: 'Bloque creado', message: data.name, color: 'teal' })
      setBuildingId(data.id)
      invalidate()
    },
    onError: (err) =>
      notifications.show({ title: 'Error', message: getApiErrorMessage(err), color: 'red' }),
  })

  const addFloorMutation = useMutation({
    mutationFn: async () => {
      if (!building) throw new Error('No building')
      const maxNum = Math.max(0, ...floors.map((f) => f.number ?? 0))
      const next = maxNum + 1
      const { data } = await api.post<Floor>('/api/Floors', {
        buildingId: building.id,
        name: `Piso ${next}`,
        number: next,
        sortOrder: next,
      })
      return data
    },
    onSuccess: (data) => {
      notifications.show({ title: 'Piso creado', message: data.name, color: 'teal' })
      setFloorId(data.id)
      invalidate()
    },
    onError: (err) =>
      notifications.show({ title: 'Error', message: getApiErrorMessage(err), color: 'red' }),
  })

  const addUnitMutation = useMutation({
    mutationFn: async (unitType: string) => {
      if (!building) throw new Error('No building')
      const isAmenity = isLinkableAmenity(unitType)
      const floor =
        floorId !== 'all'
          ? floors.find((f) => f.id === floorId)
          : floors.sort((a, b) => (a.number ?? 0) - (b.number ?? 0))[0]
      if (!isAmenity && (!floor || floor.id === '00000000-0000-0000-0000-000000000000')) {
        throw new Error('Selecciona un piso válido')
      }
      const prefix =
        unitType === 'Parking' ? 'P-' : unitType === 'Terrace' ? 'T-' : unitType === 'Storage' ? 'B-' : ''
      const nextIndex = isAmenity
        ? workspace.buildings.reduce(
            (n, b) =>
              n +
              b.floors.reduce(
                (fn, f) =>
                  fn + f.units.filter((u) => normalizeUnitType(u.unitType) === unitType).length,
                0,
              ),
            0,
          ) + 1
        : (floor?.units.length ?? 0) + 1
      const code = isAmenity
        ? `${prefix}${String(nextIndex).padStart(2, '0')}`
        : unitCode(floor!.number ?? nextIndex, nextIndex)
      const { data } = await api.post<Unit>('/api/Units', {
        horizontalPropertyId: propertyId,
        buildingId: building.id,
        floorId: isAmenity ? null : floor!.id,
        code,
        unitType,
        privateBuiltAreaM2: isAmenity ? (unitType === 'Parking' ? 12.5 : unitType === 'Storage' ? 4 : 8) : 72,
        parkingCount: 0,
        terraceCount: 0,
        storageCount: 0,
        isDoubleParking: false,
        isBillable: !isAmenity,
        isPaymentUpToDate: true,
      })
      return data
    },
    onSuccess: (data) => {
      notifications.show({ title: 'Unidad creada', message: data.code, color: 'teal' })
      setSelectedUnitId(data.id)
      invalidate()
    },
    onError: (err) =>
      notifications.show({ title: 'Error', message: getApiErrorMessage(err), color: 'red' }),
  })

  const maxCols = Math.max(1, ...visibleFloors.map((f) => f.units.length), 1)

  return (
    <Stack gap="lg">
      <PageHeader
        title="Estructura"
        description={`${workspace.buildingCount} bloques · ${workspace.floorCount} pisos · ${workspace.unitCount} unidades`}
      />

      <Box
        style={{
          display: 'grid',
          gap: 16,
          gridTemplateColumns: 'minmax(180px, 200px) minmax(0, 1fr) minmax(260px, 300px)',
        }}
      >
        <Paper withBorder p="md" radius="md">
          <Group justify="space-between" mb="sm">
            <Text fw={600} size="sm">
              Bloques
            </Text>
            <ActionIcon
              variant="subtle"
              color="teal"
              onClick={() => addBuildingMutation.mutate()}
              loading={addBuildingMutation.isPending}
              aria-label="Agregar bloque"
            >
              <IconPlus size={16} />
            </ActionIcon>
          </Group>
          <Stack gap={6}>
            {workspace.buildings.map((b) => (
              <UnstyledButton
                key={b.id}
                onClick={() => {
                  setBuildingId(b.id)
                  setFloorId('all')
                  setSelectedUnitId(null)
                }}
                p="sm"
                style={{
                  borderRadius: 8,
                  border:
                    b.id === building?.id
                      ? '1.5px solid var(--mantine-color-teal-6)'
                      : '1px solid var(--mantine-color-gray-3)',
                  background:
                    b.id === building?.id ? 'var(--mantine-color-teal-0)' : 'transparent',
                }}
              >
                <Text size="sm" fw={600}>
                  {b.name}
                </Text>
                <Text size="xs" c="dimmed">
                  {b.floors.length} pisos · {b.floors.reduce((s, f) => s + f.units.length, 0)} uds
                </Text>
              </UnstyledButton>
            ))}
          </Stack>
        </Paper>

        <Paper withBorder p="md" radius="md">
          <Stack gap="sm">
            <Group justify="space-between">
              <Group gap={6}>
                <Badge
                  style={{ cursor: 'pointer' }}
                  variant={floorId === 'all' ? 'filled' : 'light'}
                  color="teal"
                  onClick={() => setFloorId('all')}
                >
                  Todos
                </Badge>
                {[...floors]
                  .sort((a, b) => (b.number ?? 0) - (a.number ?? 0))
                  .map((f) => (
                    <Badge
                      key={f.id}
                      style={{ cursor: 'pointer' }}
                      variant={floorId === f.id ? 'filled' : 'light'}
                      color="teal"
                      onClick={() => setFloorId(f.id)}
                    >
                      {f.name}
                    </Badge>
                  ))}
              </Group>
              <Group gap={6}>
                <Button
                  size="compact-sm"
                  variant="light"
                  leftSection={<IconPlus size={14} />}
                  onClick={() => addFloorMutation.mutate()}
                  loading={addFloorMutation.isPending}
                >
                  Piso
                </Button>
                <Menu shadow="sm" width={200}>
                  <Menu.Target>
                    <Button
                      size="compact-sm"
                      color="teal"
                      leftSection={<IconPlus size={14} />}
                      loading={addUnitMutation.isPending}
                    >
                      Unidad
                    </Button>
                  </Menu.Target>
                  <Menu.Dropdown>
                    <Menu.Item onClick={() => addUnitMutation.mutate('Apartment')}>
                      Apartamento
                    </Menu.Item>
                    <Menu.Item onClick={() => addUnitMutation.mutate('House')}>Casa</Menu.Item>
                    <Menu.Divider />
                    <Menu.Item onClick={() => addUnitMutation.mutate('Parking')}>
                      Parqueadero
                    </Menu.Item>
                    <Menu.Item onClick={() => addUnitMutation.mutate('Terrace')}>Terraza</Menu.Item>
                    <Menu.Item onClick={() => addUnitMutation.mutate('Storage')}>Bodega</Menu.Item>
                  </Menu.Dropdown>
                </Menu>
              </Group>
            </Group>

            <Text size="sm" c="dimmed">
              {building?.name}
              {floorId !== 'all' ? ` · ${floors.find((f) => f.id === floorId)?.name ?? ''}` : ''}
            </Text>

            <ScrollArea.Autosize mah={560}>
              <Stack gap="md">
                {visibleFloors.map((floor) => (
                  <Stack key={floor.id} gap={6}>
                    {floorId === 'all' && (
                      <Text size="xs" c="dimmed" fw={600}>
                        {floor.name}
                      </Text>
                    )}
                    <SimpleGrid cols={{ base: 2, sm: Math.min(maxCols, 4) }} spacing={8}>
                      {floor.units.map((unit) => (
                        <UnitCell
                          key={unit.id}
                          code={unit.code}
                          areaLabel={`${unit.privateBuiltAreaM2} m²`}
                          selected={unit.id === selectedUnitId}
                          parkingCount={unit.parkingCount}
                          terraceCount={unit.terraceCount}
                          storageCount={unit.storageCount}
                          onClick={() => setSelectedUnitId(unit.id)}
                        />
                      ))}
                    </SimpleGrid>
                  </Stack>
                ))}
              </Stack>
            </ScrollArea.Autosize>
          </Stack>
        </Paper>

        <Paper withBorder p="md" radius="md">
          {selectedUnit ? (
            <Box style={{ maxHeight: 640, overflowY: 'auto' }}>
            <Stack gap="sm">
              <Group justify="space-between" align="flex-start">
                <div>
                  <Text fw={700} size="lg">
                    {editing ? draft.code : selectedUnit.unit.code}
                  </Text>
                  <Text size="sm" c="dimmed">
                    {selectedUnit.building.name} · {selectedUnit.floor.name}
                  </Text>
                </div>
                <Badge variant="light">
                  {labelForOption(UNIT_TYPE_OPTIONS, selectedUnit.unit.unitType)}
                </Badge>
              </Group>

              {!editing && personasAvailable && (
                <SegmentedControl
                  fullWidth
                  size="xs"
                  value={inspectorTab}
                  onChange={(v) => setInspectorTab(v as 'datos' | 'personas')}
                  data={[
                    { label: 'Datos', value: 'datos' },
                    { label: 'Personas', value: 'personas' },
                  ]}
                />
              )}

              {!editing && personasAvailable && inspectorTab === 'personas' ? (
                <UnitPersonasPanel
                  unitId={selectedUnit.unit.id}
                  household={householdQuery.data}
                  householdLoading={householdQuery.isLoading}
                  showHabitants={dwellingSelected}
                  onChanged={() => {
                    void householdQuery.refetch()
                    invalidate()
                  }}
                />
              ) : !editing ? (
                <>
                  <Group justify="space-between">
                    <Text size="sm" c="dimmed">
                      Área
                    </Text>
                    <Text size="sm" fw={600}>
                      {selectedUnit.unit.privateBuiltAreaM2} m²
                    </Text>
                  </Group>
                  <Group justify="space-between">
                    <Text size="sm" c="dimmed">
                      Coeficiente
                    </Text>
                    <Text size="sm" fw={600}>
                      {selectedUnit.unit.coefficient.toFixed(2)}%
                    </Text>
                  </Group>
                  <Group justify="space-between">
                    <Text size="sm" c="dimmed">
                      Pagos
                    </Text>
                    <Badge
                      size="sm"
                      variant="light"
                      color={selectedUnit.unit.isPaymentUpToDate ? 'teal' : 'red'}
                    >
                      {selectedUnit.unit.isPaymentUpToDate ? 'Al día' : 'Pendiente'}
                    </Badge>
                  </Group>

                  {parkingSelected && (
                    <Group justify="space-between">
                      <Text size="sm" c="dimmed">
                        Tipo de cupo
                      </Text>
                      <Badge size="sm" variant="light">
                        {selectedUnit.unit.isDoubleParking
                          ? 'Doble (máx. 2 vehículos)'
                          : 'Sencillo (máx. 1 vehículo)'}
                      </Badge>
                    </Group>
                  )}

                  {dwellingSelected && (
                    <UnitAmenityLinksPanel
                      propertyId={propertyId}
                      dwelling={selectedUnit.unit}
                      household={householdQuery.data}
                      onChanged={() => {
                        void householdQuery.refetch()
                        invalidate()
                      }}
                    />
                  )}

                  {isLinkableAmenity(selectedUnit.unit.unitType) && (
                    <UnitHostLinkField
                      propertyId={propertyId}
                      amenity={selectedUnit.unit}
                      onChanged={() => {
                        void householdQuery.refetch()
                        invalidate()
                      }}
                    />
                  )}

                  {parkingSelected && (
                    <UnitVehiclesPanel
                      propertyId={propertyId}
                      parkingUnitId={selectedUnit.unit.id}
                      parkingCode={selectedUnit.unit.code}
                      isDoubleParking={selectedUnit.unit.isDoubleParking ?? false}
                    />
                  )}

                  <Button color="teal" onClick={() => setEditing(true)}>
                    Editar unidad
                  </Button>
                </>
              ) : (
                <Stack gap="sm">
                  <TextInput
                    label="Código"
                    value={draft.code}
                    onChange={(e) => setDraft((d) => ({ ...d, code: e.currentTarget.value }))}
                  />
                  <Select
                    label="Tipo"
                    data={UNIT_TYPE_OPTIONS.map((o) => ({ value: o.value, label: o.label }))}
                    value={normalizeUnitType(draft.unitType) ?? draft.unitType}
                    onChange={(v) => setDraft((d) => ({ ...d, unitType: v ?? 'Apartment' }))}
                  />
                  <NumberInput
                    label="Área m²"
                    value={draft.privateBuiltAreaM2}
                    onChange={(v) => setDraft((d) => ({ ...d, privateBuiltAreaM2: Number(v) || 0 }))}
                    min={0}
                    decimalScale={2}
                  />
                  {normalizeUnitType(draft.unitType) === 'Parking' && (
                    <Switch
                      label="Parqueadero doble"
                      description="Permite hasta 2 vehículos en este cupo."
                      checked={draft.isDoubleParking}
                      onChange={(event) => {
                        const checked = event.currentTarget.checked
                        setDraft((d) => ({ ...d, isDoubleParking: checked }))
                      }}
                    />
                  )}
                  <Switch
                    label="Facturable"
                    checked={draft.isBillable}
                    onChange={(event) => {
                      const checked = event.currentTarget.checked
                      setDraft((d) => ({ ...d, isBillable: checked }))
                    }}
                  />
                  <Switch
                    label="Pagos al día"
                    checked={draft.isPaymentUpToDate}
                    onChange={(event) => {
                      const checked = event.currentTarget.checked
                      setDraft((d) => ({ ...d, isPaymentUpToDate: checked }))
                    }}
                  />
                  <Text size="xs" c="dimmed">
                    {dwellingSelected
                      ? 'Para vincular parqueadero/terraza/bodega, usa la vista Datos (no edición).'
                      : isLinkableAmenity(draft.unitType)
                        ? 'Para asignar este parqueadero/terraza/bodega a un apartamento, usa la vista Datos.'
                        : null}
                  </Text>
                  <Group>
                    <Button
                      color="teal"
                      loading={saveMutation.isPending}
                      onClick={() => saveMutation.mutate()}
                    >
                      Guardar
                    </Button>
                    <Button variant="subtle" onClick={() => setEditing(false)}>
                      Cancelar
                    </Button>
                  </Group>
                </Stack>
              )}
            </Stack>
            </Box>
          ) : (
            <Stack gap="xs">
              <Text fw={600} size="sm">
                Unidad
              </Text>
              <Text size="sm" c="dimmed">
                Selecciona una celda para ver datos o asignar personas (mensajería y
                entregas más adelante).
              </Text>
            </Stack>
          )}
        </Paper>
      </Box>
    </Stack>
  )
}

export function StructureWorkspacePage() {
  const propertyId = usePropertyId()

  const workspaceQuery = useQuery({
    queryKey: ['structure-workspace', propertyId],
    queryFn: async () => {
      const { data } = await api.get<StructureWorkspace>(
        `/api/StructureComposer/workspace?horizontalPropertyId=${encodeURIComponent(propertyId)}`,
      )
      return data
    },
  })

  if (workspaceQuery.isLoading) {
    return (
      <Stack align="center" py="xl">
        <Loader />
      </Stack>
    )
  }

  if (workspaceQuery.isError || !workspaceQuery.data) {
    return (
      <Text c="red" size="sm">
        {getApiErrorMessage(workspaceQuery.error) || 'No se pudo cargar la estructura.'}
      </Text>
    )
  }

  if (!workspaceQuery.data.hasStructure) {
    return <SetupMode propertyId={propertyId} />
  }

  return <OperateMode propertyId={propertyId} workspace={workspaceQuery.data} />
}
