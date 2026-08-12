import {
  Accordion,
  Alert,
  Badge,
  Button,
  Group,
  NumberInput,
  Paper,
  ScrollArea,
  Select,
  SimpleGrid,
  Stack,
  Switch,
  Text,
  TextInput,
  ThemeIcon,
  Title,
} from '@mantine/core'
import { notifications } from '@mantine/notifications'
import {
  IconBuilding,
  IconCheck,
  IconEye,
  IconLayersIntersect,
  IconPlus,
  IconTrash,
} from '@tabler/icons-react'
import { useMutation, useQuery } from '@tanstack/react-query'
import { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { api } from '../../../api/client'
import { getApiErrorMessage } from '../../../api/errors'
import type {
  StructureComposerCommitResult,
  StructureComposerPreview,
  StructureComposerRequest,
  StructureComposerStatus,
} from '../../../api/types'
import { PageHeader } from '../../../components/shared/PageHeader'
import { useInvalidate } from '../../../hooks/useInvalidate'
import { usePropertyId } from '../../../hooks/usePropertyId'
import { formDrawerSelectComboboxProps } from '../../../lib/formDrawerSelect'
import { labelForOption, UNIT_TYPE_OPTIONS } from '../../../lib/structureEnums'

type BuildingDraft = {
  key: string
  name: string
  code: string
  floorFrom: number
  floorTo: number
  unitsPerFloor: number
  includeBasement: boolean
  includeRooftop: boolean
  codePattern: string
  defaultUnitType: string
  defaultAreaM2: number
}

function newBuilding(index: number): BuildingDraft {
  return {
    key: crypto.randomUUID(),
    name: `Torre ${index}`,
    code: `T${index}`,
    floorFrom: 1,
    floorTo: 5,
    unitsPerFloor: 4,
    includeBasement: false,
    includeRooftop: false,
    codePattern: '{piso}{u:00}',
    defaultUnitType: 'Apartment',
    defaultAreaM2: 72,
  }
}

export function StructureComposerPage() {
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

  const [step, setStep] = useState(0)
  const [buildings, setBuildings] = useState<BuildingDraft[]>([newBuilding(1)])
  const [includeParking, setIncludeParking] = useState(false)
  const [parkingCount, setParkingCount] = useState(10)
  const [parkingArea, setParkingArea] = useState(12.5)
  const [linkParking, setLinkParking] = useState(true)
  const [includeStorage, setIncludeStorage] = useState(false)
  const [storageCount, setStorageCount] = useState(0)
  const [storageArea, setStorageArea] = useState(4)
  const [preview, setPreview] = useState<StructureComposerPreview | null>(null)
  const [removedCodes, setRemovedCodes] = useState<string[]>([])

  const statusQuery = useQuery({
    queryKey: ['structure-composer-status', propertyId],
    queryFn: async () => {
      const { data } = await api.get<StructureComposerStatus>(
        `/api/StructureComposer/status?horizontalPropertyId=${encodeURIComponent(propertyId)}`,
      )
      return data
    },
  })

  const requestBody = useMemo((): StructureComposerRequest => {
    return {
      horizontalPropertyId: propertyId,
      buildings: buildings.map((b) => ({
        name: b.name.trim(),
        code: b.code.trim() || null,
        floorFrom: b.floorFrom,
        floorTo: b.floorTo,
        unitsPerFloor: b.unitsPerFloor,
        includeBasement: b.includeBasement,
        includeRooftop: b.includeRooftop,
        codePattern: b.codePattern.trim() || '{piso}{u:00}',
        defaultUnitType: b.defaultUnitType,
        defaultAreaM2: b.defaultAreaM2,
      })),
      parking: includeParking
        ? {
            count: parkingCount,
            prefix: 'P-',
            areaM2: parkingArea,
            linkToApartmentsInOrder: linkParking,
          }
        : null,
      storage: includeStorage
        ? {
            count: storageCount,
            prefix: 'D-',
            areaM2: storageArea,
          }
        : null,
      unitOverrides: removedCodes.map((code) => ({ code, remove: true })),
    }
  }, [
    propertyId,
    buildings,
    includeParking,
    parkingCount,
    parkingArea,
    linkParking,
    includeStorage,
    storageCount,
    storageArea,
    removedCodes,
  ])

  const estimatedUnits = useMemo(() => {
    return buildings.reduce((sum, b) => {
      const floors =
        b.floorTo - b.floorFrom + 1 + (b.includeBasement ? 1 : 0) + (b.includeRooftop ? 1 : 0)
      return sum + Math.max(floors, 0) * b.unitsPerFloor
    }, 0) + (includeParking ? parkingCount : 0) + (includeStorage ? storageCount : 0)
  }, [buildings, includeParking, parkingCount, includeStorage, storageCount])

  const previewMutation = useMutation({
    mutationFn: async () => {
      const { data } = await api.post<StructureComposerPreview>('/api/StructureComposer/preview', requestBody)
      return data
    },
    onSuccess: (data) => {
      setPreview(data)
      setStep(3)
    },
    onError: (err) =>
      notifications.show({ title: 'Error', message: getApiErrorMessage(err), color: 'red' }),
  })

  const commitMutation = useMutation({
    mutationFn: async () => {
      const { data } = await api.post<StructureComposerCommitResult>(
        '/api/StructureComposer/commit',
        requestBody,
      )
      return data
    },
    onSuccess: (data) => {
      notifications.show({
        title: 'Estructura creada',
        message: `${data.buildingsCreated} bloques, ${data.floorsCreated} pisos, ${data.unitsCreated} unidades`,
        color: 'teal',
      })
      invalidate()
      navigate(`/properties/${propertyId}/units`)
    },
    onError: (err) =>
      notifications.show({ title: 'Error', message: getApiErrorMessage(err), color: 'red' }),
  })

  const updateBuilding = (key: string, patch: Partial<BuildingDraft>) => {
    setBuildings((prev) => prev.map((b) => (b.key === key ? { ...b, ...patch } : b)))
  }

  if (statusQuery.data?.hasStructure) {
    return (
      <Stack gap="md" maw={720}>
        <PageHeader
          title="Estructura"
          description="Esta propiedad ya tiene bloques y unidades configurados."
        />
        <Alert color="teal" title="Estructura lista">
          {statusQuery.data.buildingCount} bloques · {statusQuery.data.floorCount} pisos ·{' '}
          {statusQuery.data.unitCount} unidades
        </Alert>
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

  const steps = ['Bloques', 'Patrones', 'Extras', 'Vista previa', 'Confirmar']

  return (
    <Stack gap="lg">
      <PageHeader
        title="Configurar estructura"
        description="Define bloques, pisos y unidades de una vez. Ideal para el alta inicial de la copropiedad."
      />

      <Group gap="xs" wrap="wrap">
        {steps.map((label, i) => (
          <Badge key={label} size="lg" variant={step === i ? 'filled' : 'light'} color="teal">
            {i + 1}. {label}
          </Badge>
        ))}
      </Group>

      {step === 0 && (
        <Stack gap="md">
          <Text size="sm" c="dimmed">
            Agrega cada torre/bloque con su rango de pisos y unidades por piso.
          </Text>
          {buildings.map((b, index) => (
            <Paper key={b.key} withBorder p="md" radius="lg">
              <Stack gap="sm">
                <Group justify="space-between">
                  <Group gap="xs">
                    <ThemeIcon variant="light" color="teal">
                      <IconBuilding size={16} />
                    </ThemeIcon>
                    <Text fw={600}>Bloque {index + 1}</Text>
                  </Group>
                  {buildings.length > 1 && (
                    <Button
                      variant="subtle"
                      color="red"
                      size="compact-sm"
                      leftSection={<IconTrash size={14} />}
                      onClick={() => setBuildings((prev) => prev.filter((x) => x.key !== b.key))}
                    >
                      Quitar
                    </Button>
                  )}
                </Group>
                <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="sm">
                  <TextInput
                    label="Nombre"
                    value={b.name}
                    onChange={(e) => updateBuilding(b.key, { name: e.currentTarget.value })}
                  />
                  <TextInput
                    label="Código"
                    value={b.code}
                    onChange={(e) => updateBuilding(b.key, { code: e.currentTarget.value })}
                  />
                  <NumberInput
                    label="Piso desde"
                    value={b.floorFrom}
                    onChange={(v) => updateBuilding(b.key, { floorFrom: Number(v) || 1 })}
                    min={-5}
                    max={200}
                  />
                  <NumberInput
                    label="Piso hasta"
                    value={b.floorTo}
                    onChange={(v) => updateBuilding(b.key, { floorTo: Number(v) || 1 })}
                    min={-5}
                    max={200}
                  />
                  <NumberInput
                    label="Unidades por piso"
                    value={b.unitsPerFloor}
                    onChange={(v) => updateBuilding(b.key, { unitsPerFloor: Number(v) || 1 })}
                    min={1}
                    max={40}
                  />
                </SimpleGrid>
                <Group>
                  <Switch
                    label="Incluir sótano"
                    checked={b.includeBasement}
                    onChange={(e) =>
                      updateBuilding(b.key, { includeBasement: e.currentTarget.checked })
                    }
                  />
                  <Switch
                    label="Incluir azotea"
                    checked={b.includeRooftop}
                    onChange={(e) =>
                      updateBuilding(b.key, { includeRooftop: e.currentTarget.checked })
                    }
                  />
                </Group>
              </Stack>
            </Paper>
          ))}
          <Group>
            <Button
              variant="light"
              leftSection={<IconPlus size={16} />}
              onClick={() => setBuildings((prev) => [...prev, newBuilding(prev.length + 1)])}
            >
              Agregar bloque
            </Button>
            <Button onClick={() => setStep(1)}>Continuar</Button>
          </Group>
          <Text size="sm" c="dimmed">
            Estimado aproximado: ~{estimatedUnits} unidades
          </Text>
        </Stack>
      )}

      {step === 1 && (
        <Stack gap="md">
          <Text size="sm" c="dimmed">
            Patrón de códigos y tipología por defecto. Tokens: {'{piso}'}, {'{u}'}, {'{u:00}'},{' '}
            {'{bloque}'}.
          </Text>
          {buildings.map((b) => (
            <Paper key={b.key} withBorder p="md" radius="lg">
              <Stack gap="sm">
                <Text fw={600}>{b.name}</Text>
                <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="sm">
                  <TextInput
                    label="Patrón de código"
                    description="Ej. 302 = piso 3, unidad 2"
                    value={b.codePattern}
                    onChange={(e) => updateBuilding(b.key, { codePattern: e.currentTarget.value })}
                  />
                  <Select
                    label="Tipo por defecto"
                    data={[...UNIT_TYPE_OPTIONS]}
                    comboboxProps={formDrawerSelectComboboxProps}
                    value={b.defaultUnitType}
                    onChange={(v) => updateBuilding(b.key, { defaultUnitType: v || 'Apartment' })}
                  />
                  <NumberInput
                    label="Área m² por defecto"
                    decimalScale={2}
                    value={b.defaultAreaM2}
                    onChange={(v) => updateBuilding(b.key, { defaultAreaM2: Number(v) || 0 })}
                    min={0}
                  />
                </SimpleGrid>
              </Stack>
            </Paper>
          ))}
          <Group>
            <Button variant="default" onClick={() => setStep(0)}>
              Atrás
            </Button>
            <Button onClick={() => setStep(2)}>Continuar</Button>
          </Group>
        </Stack>
      )}

      {step === 2 && (
        <Stack gap="md">
          <Paper withBorder p="md" radius="lg">
            <Stack gap="sm">
              <Switch
                label="Agregar parqueaderos"
                checked={includeParking}
                onChange={(e) => setIncludeParking(e.currentTarget.checked)}
              />
              {includeParking && (
                <SimpleGrid cols={{ base: 1, sm: 3 }} spacing="sm">
                  <NumberInput
                    label="Cantidad"
                    value={parkingCount}
                    onChange={(v) => setParkingCount(Number(v) || 0)}
                    min={0}
                  />
                  <NumberInput
                    label="Área m²"
                    decimalScale={2}
                    value={parkingArea}
                    onChange={(v) => setParkingArea(Number(v) || 0)}
                    min={0}
                  />
                  <Switch
                    label="Vincular a aptos en orden"
                    checked={linkParking}
                    onChange={(e) => setLinkParking(e.currentTarget.checked)}
                    mt={28}
                  />
                </SimpleGrid>
              )}
            </Stack>
          </Paper>
          <Paper withBorder p="md" radius="lg">
            <Stack gap="sm">
              <Switch
                label="Agregar depósitos"
                checked={includeStorage}
                onChange={(e) => setIncludeStorage(e.currentTarget.checked)}
              />
              {includeStorage && (
                <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="sm">
                  <NumberInput
                    label="Cantidad"
                    value={storageCount}
                    onChange={(v) => setStorageCount(Number(v) || 0)}
                    min={0}
                  />
                  <NumberInput
                    label="Área m²"
                    decimalScale={2}
                    value={storageArea}
                    onChange={(v) => setStorageArea(Number(v) || 0)}
                    min={0}
                  />
                </SimpleGrid>
              )}
            </Stack>
          </Paper>
          <Group>
            <Button variant="default" onClick={() => setStep(1)}>
              Atrás
            </Button>
            <Button
              leftSection={<IconEye size={16} />}
              loading={previewMutation.isPending}
              onClick={() => previewMutation.mutate()}
            >
              Generar vista previa
            </Button>
          </Group>
        </Stack>
      )}

      {step === 3 && preview && (
        <Stack gap="md">
          <Group gap="xs" wrap="wrap">
            <Badge size="lg" variant="light">
              {preview.buildingCount} bloques
            </Badge>
            <Badge size="lg" variant="light" color="blue">
              {preview.floorCount} pisos
            </Badge>
            <Badge size="lg" variant="light" color="teal">
              {preview.unitCount} unidades
            </Badge>
            <Badge size="lg" variant="outline">
              {preview.totalAreaM2.toFixed(1)} m² totales
            </Badge>
          </Group>

          {preview.warnings.map((w) => (
            <Alert key={w} color="orange">
              {w}
            </Alert>
          ))}

          <Alert color="gray" title="Coeficientes">
            Al confirmar se calcularán automáticamente según el área (total 100).
          </Alert>

          <ScrollArea.Autosize mah={420}>
            <Accordion variant="separated" radius="md">
              {preview.buildings.map((b) => (
                <Accordion.Item key={`${b.name}-${b.code}`} value={`${b.name}-${b.code}`}>
                  <Accordion.Control icon={<IconBuilding size={16} />}>
                    {b.name}
                    {b.code ? ` (${b.code})` : ''} · {b.floors.length} pisos
                  </Accordion.Control>
                  <Accordion.Panel>
                    <Stack gap="sm">
                      {b.floors.map((f) => (
                        <Paper key={f.name} withBorder p="sm" radius="md">
                          <Group gap={6} mb={6}>
                            <IconLayersIntersect size={14} />
                            <Text size="sm" fw={600}>
                              {f.name}
                            </Text>
                          </Group>
                          <Group gap={6} wrap="wrap">
                            {f.units.map((u) => (
                              <Badge
                                key={u.code}
                                variant={removedCodes.includes(u.code) ? 'outline' : 'light'}
                                color={removedCodes.includes(u.code) ? 'gray' : 'teal'}
                                style={{
                                  cursor: 'pointer',
                                  textDecoration: removedCodes.includes(u.code)
                                    ? 'line-through'
                                    : undefined,
                                }}
                                onClick={() =>
                                  setRemovedCodes((prev) =>
                                    prev.includes(u.code)
                                      ? prev.filter((c) => c !== u.code)
                                      : [...prev, u.code],
                                  )
                                }
                                title="Clic para excluir / incluir"
                              >
                                {u.code} · {labelForOption(UNIT_TYPE_OPTIONS, u.unitType)} ·{' '}
                                {u.areaM2} m²
                              </Badge>
                            ))}
                          </Group>
                        </Paper>
                      ))}
                    </Stack>
                  </Accordion.Panel>
                </Accordion.Item>
              ))}
            </Accordion>
          </ScrollArea.Autosize>

          {preview.ancillaryUnits.length > 0 && (
            <Paper withBorder p="sm" radius="md">
              <Text size="sm" fw={600} mb="xs">
                Parqueaderos / depósitos
              </Text>
              <Group gap={6} wrap="wrap">
                {preview.ancillaryUnits.map((u) => (
                  <Badge key={u.code} variant="light" color="gray">
                    {u.code}
                    {u.linkedUnitCode ? ` → ${u.linkedUnitCode}` : ''}
                  </Badge>
                ))}
              </Group>
            </Paper>
          )}

          <Group>
            <Button variant="default" onClick={() => setStep(2)}>
              Atrás
            </Button>
            <Button
              onClick={() => {
                // refresh preview with removals applied
                previewMutation.mutate(undefined, {
                  onSuccess: () => setStep(4),
                })
              }}
              loading={previewMutation.isPending}
            >
              Continuar a confirmar
            </Button>
          </Group>
        </Stack>
      )}

      {step === 4 && preview && (
        <Stack gap="md" maw={640}>
          <Title order={4}>Confirmar creación</Title>
          <Text size="sm">
            Se crearán <strong>{preview.buildingCount}</strong> bloques,{' '}
            <strong>{preview.floorCount}</strong> pisos y <strong>{preview.unitCount}</strong>{' '}
            unidades. Esta es la estructura base de la propiedad.
          </Text>
          <Alert color="teal" icon={<IconCheck size={16} />}>
            Después podrás ajustar casos puntuales desde Unidades / Bloques.
          </Alert>
          <Group>
            <Button variant="default" onClick={() => setStep(3)}>
              Atrás
            </Button>
            <Button
              color="teal"
              loading={commitMutation.isPending}
              onClick={() => commitMutation.mutate()}
            >
              Crear estructura
            </Button>
          </Group>
        </Stack>
      )}
    </Stack>
  )
}
