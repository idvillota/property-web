import {
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
  SimpleGrid,
  Stack,
  Switch,
  Text,
  TextInput,
  Tooltip,
  UnstyledButton,
} from '@mantine/core'
import { notifications } from '@mantine/notifications'
import { IconArrowLeft, IconBox, IconCar, IconPlus, IconSun } from '@tabler/icons-react'
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
import { normalizeUnitType } from '../../../lib/structureEnums'
import {
  BuildingContextPanel,
  FloorContextPanel,
} from '../components/StructureContextPanel'
import { StructureBuildingTree } from '../components/StructureBuildingTree'
import { UnitInspectorPanel } from '../components/UnitInspectorPanel'
import { setupModeBlocksWhenNoUnits } from '../lib/setupModeBlocksWhenNoUnits'

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
        description="Paso 1: dimensiones · Paso 2: planta · Paso 3: confirmar creación"
      />

      {totals.units < 1 ? (
        <Text size="sm" c="dimmed">
          Habilita al menos una unidad en la planta para continuar.
        </Text>
      ) : null}

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
              onClick={() => {
                if (setupModeBlocksWhenNoUnits(totals.units)) return
                const ok = window.confirm(
                  `Se crearán ${totals.buildings} bloques, ${totals.floors} pisos y ${totals.units} unidades. ¿Confirmar?`,
                )
                if (ok) commitMutation.mutate()
              }}
              disabled={setupModeBlocksWhenNoUnits(totals.units)}
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
  const [floorId, setFloorId] = useState<string | 'all'>(() => {
    const firstFloors = workspace.buildings[0]?.floors ?? []
    if (!firstFloors.length) return 'all'
    return (
      [...firstFloors].sort((a, b) => (b.number ?? 0) - (a.number ?? 0))[0]?.id ?? 'all'
    )
  })
  const [selectedUnitId, setSelectedUnitId] = useState<string | null>(null)
  /** Option 3: explore (Planta) vs inspect (Unidad) — never both competing for height. */
  const [viewMode, setViewMode] = useState<'planta' | 'unidad'>('planta')
  const [expandedBuildingIds, setExpandedBuildingIds] = useState<string[]>(() =>
    workspace.buildings[0]?.id ? [workspace.buildings[0].id] : [],
  )

  const building = workspace.buildings.find((b) => b.id === buildingId) ?? workspace.buildings[0]
  const floors = building?.floors ?? []

  useEffect(() => {
    if (!building) return
    if (floorId !== 'all' && !floors.some((f) => f.id === floorId)) {
      setFloorId(floors[0]?.id ?? 'all')
    }
  }, [building, floorId, floors])

  const goToPlanta = (clearUnit = false) => {
    setViewMode('planta')
    if (clearUnit) setSelectedUnitId(null)
  }

  const openUnit = (unitId: string, unitFloorId?: string | null) => {
    setSelectedUnitId(unitId)
    if (unitFloorId) setFloorId(unitFloorId)
    setViewMode('unidad')
  }

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

  useEffect(() => {
    if (viewMode === 'unidad' && !selectedUnit) {
      setViewMode('planta')
    }
  }, [viewMode, selectedUnit])

  const activeFloor = floorId !== 'all' ? floors.find((f) => f.id === floorId) ?? null : null

  /** Context ficha in Planta mode (no unit dossier competing). */
  const plantaFocus: 'floor' | 'building' | 'none' = activeFloor
    ? 'floor'
    : building
      ? 'building'
      : 'none'

  const siblingUnits = selectedUnit?.floor.units ?? []

  const personasAvailable = !!selectedUnit && canAssignOwner(selectedUnit.unit.unitType)

  const householdQuery = useQuery({
    queryKey: ['unit-household', selectedUnitId],
    enabled: !!selectedUnitId && personasAvailable,
    queryFn: async () => {
      const { data } = await api.get<UnitHousehold>(`/api/Units/${selectedUnitId}/household`)
      return data
    },
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
      setFloorId('all')
      goToPlanta(true)
      setExpandedBuildingIds((ids) => (ids.includes(data.id) ? ids : [...ids, data.id]))
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
      goToPlanta(true)
      if (building) {
        setExpandedBuildingIds((ids) =>
          ids.includes(building.id) ? ids : [...ids, building.id],
        )
      }
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
      openUnit(data.id, data.floorId)
      invalidate()
    },
    onError: (err) =>
      notifications.show({ title: 'Error', message: getApiErrorMessage(err), color: 'red' }),
  })

  const maxCols = Math.max(1, ...visibleFloors.map((f) => f.units.length), 1)
  const breadcrumbFloor =
    floorId === 'all' ? null : floors.find((f) => f.id === floorId) ?? null

  const plantaContext =
    plantaFocus === 'floor' && building && activeFloor ? (
      <FloorContextPanel
        building={building}
        floor={activeFloor}
        onAddUnit={(unitType) => addUnitMutation.mutate(unitType)}
        addUnitLoading={addUnitMutation.isPending}
      />
    ) : plantaFocus === 'building' && building ? (
      <BuildingContextPanel
        building={building}
        onSelectFloor={(id) => {
          setFloorId(id)
          goToPlanta(true)
          setExpandedBuildingIds((ids) =>
            building && ids.includes(building.id) ? ids : [...ids, building.id],
          )
        }}
        onAddFloor={() => addFloorMutation.mutate()}
        addFloorLoading={addFloorMutation.isPending}
      />
    ) : (
      <Stack gap="xs">
        <Text fw={600} size="sm">
          Detalle
        </Text>
        <Text size="sm" c="dimmed">
          Selecciona un bloque o piso en el árbol, o una unidad en la planta.
        </Text>
      </Stack>
    )

  const planToolbar = (
    <Group justify="space-between" align="flex-start" wrap="wrap">
      <Stack gap={2}>
        <Text size="sm" fw={600}>
          {building?.name ?? 'Bloque'}
          {breadcrumbFloor
            ? ` / ${breadcrumbFloor.name}`
            : floorId === 'all'
              ? ' / Todos los pisos'
              : ''}
        </Text>
        {floorId !== 'all' ? (
          <UnstyledButton
            onClick={() => {
              setFloorId('all')
              goToPlanta(true)
            }}
          >
            <Text size="xs" c="teal" fw={600}>
              Ver todos los pisos
            </Text>
          </UnstyledButton>
        ) : (
          <Text size="xs" c="dimmed">
            Elige un piso en el árbol o una unidad en la planta
          </Text>
        )}
      </Stack>
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
  )

  const floorPlanGrid = (
    <Stack gap="md">
      {visibleFloors.length === 0 ? (
        <Text size="sm" c="dimmed">
          Este bloque no tiene pisos. Agrega un piso para ubicar unidades.
        </Text>
      ) : (
        visibleFloors.map((floor) => (
          <Stack key={floor.id} gap={6}>
            {floorId === 'all' && (
              <Text size="xs" c="dimmed" fw={600}>
                {floor.name}
              </Text>
            )}
            <SimpleGrid cols={{ base: 2, sm: Math.min(Math.max(maxCols, 2), 6) }} spacing={8}>
              {floor.units.map((unit) => (
                <UnitCell
                  key={unit.id}
                  code={unit.code}
                  areaLabel={`${unit.privateBuiltAreaM2} m²`}
                  selected={unit.id === selectedUnitId}
                  parkingCount={unit.parkingCount}
                  terraceCount={unit.terraceCount}
                  storageCount={unit.storageCount}
                  onClick={() => openUnit(unit.id, unit.floorId)}
                />
              ))}
            </SimpleGrid>
            {floor.units.length === 0 && floorId !== 'all' && (
              <Text size="sm" c="dimmed">
                Sin unidades en este piso.
              </Text>
            )}
          </Stack>
        ))
      )}
    </Stack>
  )

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
          gridTemplateColumns: 'minmax(200px, 240px) minmax(0, 1fr)',
          alignItems: 'start',
        }}
      >
        <Paper withBorder p="md" radius="md">
          <StructureBuildingTree
            buildings={workspace.buildings}
            buildingId={building?.id ?? ''}
            floorId={floorId}
            expandedIds={expandedBuildingIds}
            onToggleExpand={(id) =>
              setExpandedBuildingIds((ids) =>
                ids.includes(id) ? ids.filter((x) => x !== id) : [...ids, id],
              )
            }
            onSelectBuilding={(id) => {
              setBuildingId(id)
              setFloorId('all')
              goToPlanta(true)
              setExpandedBuildingIds((ids) => (ids.includes(id) ? ids : [...ids, id]))
            }}
            onSelectFloor={(bId, fId) => {
              setBuildingId(bId)
              setFloorId(fId)
              goToPlanta(true)
              setExpandedBuildingIds((ids) => (ids.includes(bId) ? ids : [...ids, bId]))
            }}
            onAddBuilding={() => addBuildingMutation.mutate()}
            addBuildingLoading={addBuildingMutation.isPending}
          />
        </Paper>

        <Stack gap="md">
          <Group justify="space-between" align="center" wrap="wrap">
            <SegmentedControl
              value={viewMode}
              onChange={(v) => {
                const next = v as 'planta' | 'unidad'
                if (next === 'planta') {
                  goToPlanta()
                  return
                }
                if (selectedUnit) {
                  setViewMode('unidad')
                  return
                }
                notifications.show({
                  title: 'Selecciona una unidad',
                  message: 'Haz clic en una celda de la planta para abrir su ficha.',
                  color: 'gray',
                })
              }}
              data={[
                { label: 'Planta', value: 'planta' },
                { label: 'Unidad', value: 'unidad', disabled: !selectedUnit },
              ]}
            />
            {viewMode === 'unidad' && selectedUnit && (
              <Button
                size="compact-sm"
                variant="subtle"
                leftSection={<IconArrowLeft size={14} />}
                onClick={() => goToPlanta()}
              >
                Volver a planta
              </Button>
            )}
          </Group>

          {viewMode === 'planta' ? (
            <>
              <Paper withBorder p="md" radius="md">
                <Stack gap="sm">
                  {planToolbar}
                  <ScrollArea.Autosize mah={560}>{floorPlanGrid}</ScrollArea.Autosize>
                </Stack>
              </Paper>
              <Paper withBorder p="md" radius="md">
                <Text size="xs" c="dimmed" fw={600} tt="uppercase" mb="sm">
                  {plantaFocus === 'floor'
                    ? 'Ficha de piso'
                    : plantaFocus === 'building'
                      ? 'Ficha de bloque'
                      : 'Detalle'}
                </Text>
                {plantaContext}
              </Paper>
            </>
          ) : selectedUnit ? (
            <Paper withBorder p="md" radius="md">
              <Stack gap="md">
                {siblingUnits.length > 1 && (
                  <Stack gap={6}>
                    <Text size="xs" c="dimmed" fw={600}>
                      {selectedUnit.building.name} · {selectedUnit.floor.name}
                    </Text>
                    <ScrollArea type="hover" offsetScrollbars>
                      <Group gap={6} wrap="nowrap" pb={4}>
                        {siblingUnits.map((unit) => (
                          <Box key={unit.id} style={{ flex: '0 0 auto', width: 72 }}>
                            <UnitCell
                              code={unit.code}
                              selected={unit.id === selectedUnitId}
                              parkingCount={unit.parkingCount}
                              terraceCount={unit.terraceCount}
                              storageCount={unit.storageCount}
                              onClick={() => openUnit(unit.id, unit.floorId)}
                            />
                          </Box>
                        ))}
                      </Group>
                    </ScrollArea>
                    <Divider />
                  </Stack>
                )}
                <UnitInspectorPanel
                  propertyId={propertyId}
                  selected={selectedUnit}
                  household={householdQuery.data}
                  householdLoading={householdQuery.isLoading}
                  onChanged={() => {
                    void householdQuery.refetch()
                    invalidate()
                  }}
                />
              </Stack>
            </Paper>
          ) : null}
        </Stack>
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
