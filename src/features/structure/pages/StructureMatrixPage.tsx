import {
  ActionIcon,
  Alert,
  Badge,
  Button,
  Group,
  Loader,
  NumberInput,
  Paper,
  ScrollArea,
  SegmentedControl,
  SimpleGrid,
  Stack,
  Table,
  Text,
  TextInput,
  ThemeIcon,
  Tooltip,
} from '@mantine/core'
import { notifications } from '@mantine/notifications'
import {
  IconBuilding,
  IconPlus,
  IconTrash,
  IconCheck,
} from '@tabler/icons-react'
import { useMutation, useQuery } from '@tanstack/react-query'
import { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { api } from '../../../api/client'
import { getApiErrorMessage } from '../../../api/errors'
import type {
  Building,
  Floor,
  StructureComposerCommitResult,
  StructureComposerRequest,
  StructureComposerStatus,
  Unit,
} from '../../../api/types'
import { PageHeader } from '../../../components/shared/PageHeader'
import { useEntityOptions } from '../../../hooks/useEntityOptions'
import { useInvalidate } from '../../../hooks/useInvalidate'
import { usePropertyId } from '../../../hooks/usePropertyId'

type MatrixUnit = {
  key: string
  index: number
  code: string
  enabled: boolean
  areaM2: number
  unitType: string
}

type MatrixFloor = {
  key: string
  number: number
  name: string
  units: MatrixUnit[]
}

type MatrixBuilding = {
  key: string
  name: string
  code: string
  floors: MatrixFloor[]
}

function unitCode(floorNumber: number, unitIndex: number) {
  return `${floorNumber}${String(unitIndex).padStart(2, '0')}`
}

function makeUnit(floorNumber: number, unitIndex: number, areaM2 = 72): MatrixUnit {
  return {
    key: crypto.randomUUID(),
    index: unitIndex,
    code: unitCode(floorNumber, unitIndex),
    enabled: true,
    areaM2,
    unitType: 'Apartment',
  }
}

function makeFloor(floorNumber: number, unitsPerFloor: number, areaM2 = 72): MatrixFloor {
  return {
    key: crypto.randomUUID(),
    number: floorNumber,
    name: `Piso ${floorNumber}`,
    units: Array.from({ length: unitsPerFloor }, (_, i) => makeUnit(floorNumber, i + 1, areaM2)),
  }
}

function makeBuilding(
  buildingIndex: number,
  floorCount: number,
  unitsPerFloor: number,
  areaM2 = 72,
): MatrixBuilding {
  return {
    key: crypto.randomUUID(),
    name: `Torre ${buildingIndex}`,
    code: `T${buildingIndex}`,
    floors: Array.from({ length: floorCount }, (_, i) => makeFloor(i + 1, unitsPerFloor, areaM2)),
  }
}

function buildMatrix(buildingCount: number, floorCount: number, unitsPerFloor: number): MatrixBuilding[] {
  const b = Math.max(1, Math.min(50, buildingCount))
  const f = Math.max(1, Math.min(100, floorCount))
  const u = Math.max(1, Math.min(40, unitsPerFloor))
  return Array.from({ length: b }, (_, i) => makeBuilding(i + 1, f, u))
}

/** Resize an existing matrix to new counts, preserving cells where position matches. */
function resizeMatrix(
  current: MatrixBuilding[],
  buildingCount: number,
  floorCount: number,
  unitsPerFloor: number,
): MatrixBuilding[] {
  const next = buildMatrix(buildingCount, floorCount, unitsPerFloor)
  for (let bi = 0; bi < next.length; bi++) {
    const prevB = current[bi]
    if (!prevB) continue
    next[bi].name = prevB.name
    next[bi].code = prevB.code
    for (let fi = 0; fi < next[bi].floors.length; fi++) {
      const prevF = prevB.floors[fi]
      if (!prevF) continue
      next[bi].floors[fi].name = prevF.name
      next[bi].floors[fi].number = prevF.number
      for (let ui = 0; ui < next[bi].floors[fi].units.length; ui++) {
        const prevU = prevF.units[ui]
        if (!prevU) continue
        next[bi].floors[fi].units[ui] = {
          ...next[bi].floors[fi].units[ui],
          enabled: prevU.enabled,
          areaM2: prevU.areaM2,
          unitType: prevU.unitType,
          code: unitCode(next[bi].floors[fi].number, ui + 1),
        }
      }
    }
  }
  return next
}

function matrixFromExisting(
  buildings: Building[],
  floors: Floor[],
  units: Unit[],
): MatrixBuilding[] {
  const sortedBuildings = [...buildings].sort((a, b) => a.sortOrder - b.sortOrder || a.name.localeCompare(b.name))
  return sortedBuildings.map((b) => {
    const buildingFloors = floors
      .filter((f) => f.buildingId === b.id)
      .sort((a, c) => (a.number ?? a.sortOrder) - (c.number ?? c.sortOrder))

    const floorsOrVirtual: MatrixFloor[] =
      buildingFloors.length > 0
        ? buildingFloors.map((f) => {
            const floorUnits = units
              .filter((u) => u.floorId === f.id && u.isActive)
              .sort((a, c) => a.code.localeCompare(c.code))
            return {
              key: f.id,
              number: f.number ?? f.sortOrder,
              name: f.name,
              units: floorUnits.map((u, idx) => ({
                key: u.id,
                index: idx + 1,
                code: u.code,
                enabled: true,
                areaM2: u.privateBuiltAreaM2,
                unitType: String(u.unitType),
              })),
            }
          })
        : [
            {
              key: `${b.id}-nofloor`,
              number: 0,
              name: 'Sin piso',
              units: units
                .filter((u) => u.buildingId === b.id && !u.floorId && u.isActive)
                .sort((a, c) => a.code.localeCompare(c.code))
                .map((u, idx) => ({
                  key: u.id,
                  index: idx + 1,
                  code: u.code,
                  enabled: true,
                  areaM2: u.privateBuiltAreaM2,
                  unitType: String(u.unitType),
                })),
            },
          ]

    return {
      key: b.id,
      name: b.name,
      code: b.code ?? '',
      floors: floorsOrVirtual.filter((f) => f.units.length > 0 || buildingFloors.length > 0),
    }
  })
}

function toComposerRequest(propertyId: string, matrix: MatrixBuilding[]): StructureComposerRequest {
  const unitOverrides: StructureComposerRequest['unitOverrides'] = []

  const buildings = matrix.map((b) => {
    const floors = [...b.floors].sort((a, c) => a.number - c.number)
    const floorFrom = floors[0]?.number ?? 1
    const floorTo = floors[floors.length - 1]?.number ?? 1
    const unitsPerFloor = Math.max(1, ...floors.map((f) => f.units.length), 1)

    // Contiguous floors generated by API — remove any missing floor's units
    const present = new Set(floors.map((f) => f.number))
    for (let n = floorFrom; n <= floorTo; n++) {
      if (!present.has(n)) {
        for (let u = 1; u <= unitsPerFloor; u++) {
          unitOverrides.push({ code: unitCode(n, u), remove: true })
        }
      }
    }

    for (const floor of floors) {
      for (const unit of floor.units) {
        if (!unit.enabled) {
          unitOverrides.push({ code: unit.code, remove: true })
        } else if (unit.areaM2 !== 72 || unit.unitType !== 'Apartment') {
          unitOverrides.push({
            code: unit.code,
            areaM2: unit.areaM2,
            unitType: unit.unitType,
          })
        }
      }
      // If this floor has fewer columns than unitsPerFloor, remove the extra generated codes
      for (let u = floor.units.length + 1; u <= unitsPerFloor; u++) {
        unitOverrides.push({ code: unitCode(floor.number, u), remove: true })
      }
    }

    return {
      name: b.name.trim() || b.code,
      code: b.code.trim() || null,
      floorFrom,
      floorTo,
      unitsPerFloor,
      includeBasement: false,
      includeRooftop: false,
      codePattern: '{piso}{u:00}',
      defaultUnitType: 'Apartment',
      defaultAreaM2: 72,
    }
  })

  return {
    horizontalPropertyId: propertyId,
    buildings,
    parking: null,
    storage: null,
    unitOverrides,
  }
}

export function StructureMatrixPage() {
  const propertyId = usePropertyId()
  const navigate = useNavigate()
  const invalidate = useInvalidate([
    'buildings',
    'building-options',
    'floors',
    'floor-options',
    'units',
    'unit-options',
    'coefficient-summary',
    'structure-composer-status',
  ])

  const [buildingCount, setBuildingCount] = useState(1)
  const [floorCount, setFloorCount] = useState(5)
  const [unitsPerFloor, setUnitsPerFloor] = useState(4)
  const [matrix, setMatrix] = useState<MatrixBuilding[]>(() => {
    const initial = buildMatrix(1, 5, 4)
    return initial
  })
  const [activeBuildingKey, setActiveBuildingKey] = useState<string>('')
  const [defaultArea, setDefaultArea] = useState(72)

  const statusQuery = useQuery({
    queryKey: ['structure-composer-status', propertyId],
    queryFn: async () => {
      const { data } = await api.get<StructureComposerStatus>(
        `/api/StructureComposer/status?horizontalPropertyId=${encodeURIComponent(propertyId)}`,
      )
      return data
    },
  })

  const hasStructure = !!statusQuery.data?.hasStructure

  const buildingsQuery = useEntityOptions<Building>(
    'matrix-buildings',
    '/api/Buildings',
    { horizontalPropertyId: propertyId },
    hasStructure,
  )
  const floorsQuery = useEntityOptions<Floor>(
    'matrix-floors',
    '/api/Floors',
    { horizontalPropertyId: propertyId },
    hasStructure,
  )
  const unitsQuery = useEntityOptions<Unit>(
    'matrix-units',
    '/api/Units',
    { horizontalPropertyId: propertyId },
    hasStructure,
  )

  const readonlyMatrix = useMemo(() => {
    if (!hasStructure) return []
    return matrixFromExisting(buildingsQuery.data ?? [], floorsQuery.data ?? [], unitsQuery.data ?? [])
  }, [hasStructure, buildingsQuery.data, floorsQuery.data, unitsQuery.data])

  const [readonlyBuildingKey, setReadonlyBuildingKey] = useState('')

  const activeReadonlyBuilding =
    readonlyMatrix.find((b) => b.key === readonlyBuildingKey) ?? readonlyMatrix[0] ?? null

  const activeBuilding =
    matrix.find((b) => b.key === activeBuildingKey) ?? matrix[0] ?? null

  const applyCounts = (buildings: number, floors: number, units: number) => {
    const b = Math.max(1, Math.min(50, buildings))
    const f = Math.max(1, Math.min(100, floors))
    const u = Math.max(1, Math.min(40, units))
    setBuildingCount(b)
    setFloorCount(f)
    setUnitsPerFloor(u)
    setMatrix((prev) => {
      const next = resizeMatrix(prev, b, f, u)
      const keep = activeBuildingKey && next.some((x) => x.key === activeBuildingKey)
      queueMicrotask(() => setActiveBuildingKey(keep ? activeBuildingKey : (next[0]?.key ?? '')))
      return next
    })
  }

  const totals = useMemo(() => {
    const floors = matrix.reduce((s, b) => s + b.floors.length, 0)
    const units = matrix.reduce(
      (s, b) => s + b.floors.reduce((fs, f) => fs + f.units.filter((u) => u.enabled).length, 0),
      0,
    )
    return { buildings: matrix.length, floors, units }
  }, [matrix])

  const commitMutation = useMutation({
    mutationFn: async () => {
      const body = toComposerRequest(propertyId, matrix)
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
      navigate(`/properties/${propertyId}/units`)
    },
    onError: (err) =>
      notifications.show({ title: 'Error', message: getApiErrorMessage(err), color: 'red' }),
  })

  const applyDefaultAreaToAll = () => {
    setMatrix((prev) =>
      prev.map((b) => ({
        ...b,
        floors: b.floors.map((f) => ({
          ...f,
          units: f.units.map((u) => ({ ...u, areaM2: defaultArea })),
        })),
      })),
    )
  }

  const addBuildingManual = () => {
    const floors = matrix[0]?.floors.length ?? floorCount
    const units = matrix[0]?.floors[0]?.units.length ?? unitsPerFloor
    const added = makeBuilding(matrix.length + 1, floors, units, defaultArea)
    setMatrix((prev) => [...prev, added])
    setBuildingCount(matrix.length + 1)
    setActiveBuildingKey(added.key)
  }

  const removeBuildingManual = (key: string) => {
    if (matrix.length <= 1) return
    const next = matrix.filter((b) => b.key !== key)
    setMatrix(next)
    setBuildingCount(next.length)
    setActiveBuildingKey(next.some((b) => b.key === activeBuildingKey) ? activeBuildingKey : (next[0]?.key ?? ''))
  }

  const addFloorManual = () => {
    if (!activeBuilding) return
    setMatrix((prev) =>
      prev.map((b) => {
        if (b.key !== activeBuilding.key) return b
        const nextNum = (b.floors[b.floors.length - 1]?.number ?? 0) + 1
        const cols = b.floors[0]?.units.length ?? unitsPerFloor
        return { ...b, floors: [...b.floors, makeFloor(nextNum, cols, defaultArea)] }
      }),
    )
  }

  const removeFloorManual = (floorKey: string) => {
    if (!activeBuilding || activeBuilding.floors.length <= 1) return
    setMatrix((prev) =>
      prev.map((b) => {
        if (b.key !== activeBuilding.key) return b
        return { ...b, floors: b.floors.filter((f) => f.key !== floorKey) }
      }),
    )
  }

  const toggleUnit = (floorKey: string, unitKey: string) => {
    if (!activeBuilding) return
    setMatrix((prev) =>
      prev.map((b) => {
        if (b.key !== activeBuilding.key) return b
        return {
          ...b,
          floors: b.floors.map((f) => {
            if (f.key !== floorKey) return f
            return {
              ...f,
              units: f.units.map((u) =>
                u.key === unitKey ? { ...u, enabled: !u.enabled } : u,
              ),
            }
          }),
        }
      }),
    )
  }

  const updateBuildingMeta = (patch: Partial<Pick<MatrixBuilding, 'name' | 'code'>>) => {
    if (!activeBuilding) return
    setMatrix((prev) =>
      prev.map((b) => (b.key === activeBuilding.key ? { ...b, ...patch } : b)),
    )
  }

  if (statusQuery.isLoading || (hasStructure && (buildingsQuery.isLoading || floorsQuery.isLoading || unitsQuery.isLoading))) {
    return (
      <Stack align="center" py="xl">
        <Loader />
      </Stack>
    )
  }

  if (hasStructure) {
    const readonlyCols = Math.max(
      1,
      ...(activeReadonlyBuilding?.floors.map((f) => f.units.length) ?? [1]),
    )

    return (
      <Stack gap="lg">
        <PageHeader
          title="Matriz de estructura"
          description="Vista de solo lectura. La creación por matriz solo está disponible en el alta inicial."
        />
        <Alert color="gray" title="Solo lectura">
          Esta propiedad ya tiene {statusQuery.data?.buildingCount} bloques y{' '}
          {statusQuery.data?.unitCount} unidades. Para cambios puntuales usa Unidades o Bloques.
        </Alert>

        <Group gap="xs">
          <Badge size="lg" variant="light" color="teal">
            {readonlyMatrix.length} bloques
          </Badge>
          <Badge size="lg" variant="light" color="blue">
            {readonlyMatrix.reduce((s, b) => s + b.floors.length, 0)} pisos
          </Badge>
          <Badge size="lg" variant="light">
            {readonlyMatrix.reduce(
              (s, b) => s + b.floors.reduce((fs, f) => fs + f.units.length, 0),
              0,
            )}{' '}
            unidades
          </Badge>
        </Group>

        {readonlyMatrix.length > 0 && (
          <SegmentedControl
            value={activeReadonlyBuilding?.key ?? ''}
            onChange={setReadonlyBuildingKey}
            data={readonlyMatrix.map((b) => ({
              value: b.key,
              label: b.code || b.name,
            }))}
          />
        )}

        {activeReadonlyBuilding ? (
          <Paper withBorder p="md" radius="lg">
            <Text fw={600} mb="sm">
              {activeReadonlyBuilding.name}
              {activeReadonlyBuilding.code ? ` (${activeReadonlyBuilding.code})` : ''}
            </Text>
            <ScrollArea.Autosize mah={480}>
              <Table withTableBorder withColumnBorders stickyHeader>
                <Table.Thead>
                  <Table.Tr>
                    <Table.Th style={{ minWidth: 110 }}>Piso</Table.Th>
                    {Array.from({ length: readonlyCols }, (_, i) => (
                      <Table.Th key={i} ta="center">
                        U{i + 1}
                      </Table.Th>
                    ))}
                  </Table.Tr>
                </Table.Thead>
                <Table.Tbody>
                  {[...activeReadonlyBuilding.floors]
                    .sort((a, b) => b.number - a.number)
                    .map((floor) => (
                      <Table.Tr key={floor.key}>
                        <Table.Td>
                          <Text size="sm" fw={600}>
                            {floor.name}
                          </Text>
                        </Table.Td>
                        {Array.from({ length: readonlyCols }, (_, i) => {
                          const unit = floor.units[i]
                          return (
                            <Table.Td key={i} ta="center" p={6}>
                              {unit ? (
                                <Badge variant="light" color="teal">
                                  {unit.code}
                                </Badge>
                              ) : (
                                <Text size="xs" c="dimmed">
                                  —
                                </Text>
                              )}
                            </Table.Td>
                          )
                        })}
                      </Table.Tr>
                    ))}
                </Table.Tbody>
              </Table>
            </ScrollArea.Autosize>
          </Paper>
        ) : (
          <Text size="sm" c="dimmed">
            No hay datos de estructura para mostrar.
          </Text>
        )}

        <Group>
          <Button component={Link} to={`/properties/${propertyId}/units`}>
            Ir a unidades
          </Button>
          <Button component={Link} to={`/properties/${propertyId}/buildings`} variant="light">
            Edición avanzada
          </Button>
        </Group>
      </Stack>
    )
  }

  const columnCount = activeBuilding?.floors[0]?.units.length ?? unitsPerFloor

  return (
    <Stack gap="lg">
      <PageHeader
        title="Matriz de estructura"
        description="Define cuántos bloques, pisos y unidades. La matriz se actualiza sola; también puedes sumar o quitar pisos/bloques a mano."
      />

      <Paper withBorder p="md" radius="lg">
        <SimpleGrid cols={{ base: 1, sm: 4 }} spacing="sm">
          <NumberInput
            label="Bloques (torres)"
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
            label="Área m² por defecto"
            value={defaultArea}
            onChange={(v) => setDefaultArea(Number(v) || 0)}
            min={0}
            decimalScale={2}
            description={
              <Text
                component="button"
                type="button"
                size="xs"
                c="teal"
                style={{ cursor: 'pointer', background: 'none', border: 0, padding: 0 }}
                onClick={applyDefaultAreaToAll}
              >
                Aplicar a toda la matriz
              </Text>
            }
          />
        </SimpleGrid>
        <Group mt="md" gap="xs">
          <Badge size="lg" variant="light" color="teal">
            {totals.buildings} bloques
          </Badge>
          <Badge size="lg" variant="light" color="blue">
            {totals.floors} pisos
          </Badge>
          <Badge size="lg" variant="light">
            {totals.units} unidades activas
          </Badge>
        </Group>
      </Paper>

      <Group justify="space-between" align="flex-end" wrap="wrap">
        <Stack gap={6}>
          <Text size="sm" fw={600}>
            Bloque activo
          </Text>
          <SegmentedControl
            value={activeBuilding?.key ?? ''}
            onChange={setActiveBuildingKey}
            data={matrix.map((b) => ({ value: b.key, label: b.code || b.name }))}
          />
        </Stack>
        <Group gap="xs">
          <Button variant="light" leftSection={<IconPlus size={16} />} onClick={addBuildingManual}>
            Agregar bloque
          </Button>
          <Button variant="light" leftSection={<IconPlus size={16} />} onClick={addFloorManual}>
            Agregar piso
          </Button>
        </Group>
      </Group>

      {activeBuilding && (
        <Paper withBorder p="md" radius="lg">
          <Stack gap="md">
            <Group justify="space-between" align="flex-start">
              <Group gap="sm" grow style={{ flex: 1 }}>
                <TextInput
                  label="Nombre del bloque"
                  value={activeBuilding.name}
                  onChange={(e) => updateBuildingMeta({ name: e.currentTarget.value })}
                />
                <TextInput
                  label="Código"
                  value={activeBuilding.code}
                  onChange={(e) => updateBuildingMeta({ code: e.currentTarget.value })}
                />
              </Group>
              {matrix.length > 1 && (
                <Tooltip label="Quitar este bloque">
                  <ActionIcon
                    color="red"
                    variant="light"
                    mt={28}
                    onClick={() => removeBuildingManual(activeBuilding.key)}
                  >
                    <IconTrash size={16} />
                  </ActionIcon>
                </Tooltip>
              )}
            </Group>

            <Text size="xs" c="dimmed">
              Clic en una celda para activarla / desactivarla (ej. local comercial vacío). Los códigos
              se generan como 101, 102…
            </Text>

            <ScrollArea.Autosize mah={480}>
              <Table withTableBorder withColumnBorders stickyHeader>
                <Table.Thead>
                  <Table.Tr>
                    <Table.Th style={{ minWidth: 110 }}>Piso</Table.Th>
                    {Array.from({ length: columnCount }, (_, i) => (
                      <Table.Th key={i} ta="center">
                        U{i + 1}
                      </Table.Th>
                    ))}
                    <Table.Th w={48} />
                  </Table.Tr>
                </Table.Thead>
                <Table.Tbody>
                  {[...activeBuilding.floors]
                    .sort((a, b) => b.number - a.number)
                    .map((floor) => (
                      <Table.Tr key={floor.key}>
                        <Table.Td>
                          <Group gap={6} wrap="nowrap">
                            <ThemeIcon size="sm" variant="light" color="blue">
                              <IconBuilding size={12} />
                            </ThemeIcon>
                            <Text size="sm" fw={600}>
                              {floor.name}
                            </Text>
                          </Group>
                        </Table.Td>
                        {floor.units.map((unit) => (
                          <Table.Td key={unit.key} ta="center" p={6}>
                            <Button
                              size="compact-sm"
                              variant={unit.enabled ? 'light' : 'outline'}
                              color={unit.enabled ? 'teal' : 'gray'}
                              fullWidth
                              onClick={() => toggleUnit(floor.key, unit.key)}
                              styles={{
                                root: {
                                  textDecoration: unit.enabled ? undefined : 'line-through',
                                  opacity: unit.enabled ? 1 : 0.55,
                                },
                              }}
                            >
                              {unit.code}
                            </Button>
                          </Table.Td>
                        ))}
                        <Table.Td>
                          {activeBuilding.floors.length > 1 && (
                            <ActionIcon
                              size="sm"
                              color="red"
                              variant="subtle"
                              onClick={() => removeFloorManual(floor.key)}
                              aria-label="Quitar piso"
                            >
                              <IconTrash size={14} />
                            </ActionIcon>
                          )}
                        </Table.Td>
                      </Table.Tr>
                    ))}
                </Table.Tbody>
              </Table>
            </ScrollArea.Autosize>
          </Stack>
        </Paper>
      )}

      <Group>
        <Button
          color="teal"
          leftSection={<IconCheck size={16} />}
          loading={commitMutation.isPending}
          onClick={() => commitMutation.mutate()}
        >
          Crear estructura desde la matriz
        </Button>
        <Button component={Link} to={`/properties/${propertyId}/estructura`} variant="subtle">
          Usar asistente por pasos
        </Button>
      </Group>
    </Stack>
  )
}
