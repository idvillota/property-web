import {
  Alert,
  Badge,
  Button,
  Group,
  Loader,
  NumberInput,
  Paper,
  Select,
  SimpleGrid,
  Stack,
  Switch,
  Text,
  TextInput,
  ThemeIcon,
  UnstyledButton,
} from '@mantine/core'
import { useForm } from '@mantine/form'
import { notifications } from '@mantine/notifications'
import {
  IconBuilding,
  IconDoor,
  IconLayersIntersect,
  IconPlus,
  IconUsers,
} from '@tabler/icons-react'
import { useMutation, useQuery } from '@tanstack/react-query'
import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../../../api/client'
import { getApiErrorMessage } from '../../../api/errors'
import type {
  Building,
  CoefficientSummary,
  Floor,
  StructureComposerStatus,
  Unit,
  UnitHousehold,
} from '../../../api/types'
import { FormDrawer } from '../../../components/crud/FormDrawer'
import { PageHeader } from '../../../components/shared/PageHeader'
import { useEntityOptions } from '../../../hooks/useEntityOptions'
import { useInvalidate } from '../../../hooks/useInvalidate'
import { usePropertyId } from '../../../hooks/usePropertyId'
import { formDrawerSelectComboboxProps } from '../../../lib/formDrawerSelect'
import { labelForOption, normalizeUnitType, UNIT_TYPE_OPTIONS } from '../../../lib/structureEnums'
import { formatUnitOptionLabel } from '../../../lib/unitLabels'
import { PersonChip } from '../components/PersonChip'

function isDwelling(unitType: string | number | null | undefined) {
  const t = normalizeUnitType(unitType)
  return t === 'Apartment' || t === 'House'
}

function isAmenity(unitType: string | number | null | undefined) {
  const t = normalizeUnitType(unitType)
  return t === 'Parking' || t === 'Terrace' || t === 'Storage'
}

export function UnitsPage() {
  const propertyId = usePropertyId()
  const [buildingId, setBuildingId] = useState<string | null>(null)
  const [floorId, setFloorId] = useState<string | null>(null)
  const [drawer, setDrawer] = useState<'create' | Unit | null>(null)
  const [selectedUnit, setSelectedUnit] = useState<Unit | null>(null)
  const invalidate = useInvalidate(['units', 'unit-options', 'coefficient-summary', 'unit-household'])

  const buildings = useEntityOptions<Building>('building-options', '/api/Buildings', {
    horizontalPropertyId: propertyId,
  })
  const floors = useEntityOptions<Floor>('floor-options', '/api/Floors', {
    horizontalPropertyId: propertyId,
  })
  const units = useEntityOptions<Unit>('unit-options', '/api/Units', {
    horizontalPropertyId: propertyId,
  })

  const buildingById = useMemo(() => {
    const map = new Map<string, Building>()
    for (const b of buildings.data ?? []) map.set(b.id, b)
    return map
  }, [buildings.data])

  useEffect(() => {
    if (!buildingId && (buildings.data?.length ?? 0) > 0) {
      setBuildingId(buildings.data![0].id)
    }
  }, [buildings.data, buildingId])

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        await api.post(
          `/api/Units/recalculate-coefficients?horizontalPropertyId=${encodeURIComponent(propertyId)}`,
        )
        if (!cancelled) invalidate()
      } catch {
        /* ignore */
      }
    })()
    return () => {
      cancelled = true
    }
  }, [propertyId])

  const summaryQuery = useQuery({
    queryKey: ['coefficient-summary', propertyId],
    queryFn: async () => {
      const { data } = await api.get<CoefficientSummary>(
        `/api/Units/coefficient-summary?horizontalPropertyId=${encodeURIComponent(propertyId)}`,
      )
      return data
    },
  })

  const structureQuery = useQuery({
    queryKey: ['structure-composer-status', propertyId],
    queryFn: async () => {
      const { data } = await api.get<StructureComposerStatus>(
        `/api/StructureComposer/status?horizontalPropertyId=${encodeURIComponent(propertyId)}`,
      )
      return data
    },
  })

  const householdQuery = useQuery({
    queryKey: ['unit-household', selectedUnit?.id],
    enabled: !!selectedUnit && isDwelling(selectedUnit.unitType),
    queryFn: async () => {
      const { data } = await api.get<UnitHousehold>(`/api/Units/${selectedUnit!.id}/household`)
      return data
    },
  })

  const form = useForm({
    initialValues: {
      code: '',
      unitType: 'Apartment',
      buildingId: '' as string | null,
      floorId: '' as string | null,
      privateBuiltAreaM2: 0,
      privateOpenAreaM2: null as number | null,
      contributionModuleCode: '',
      linkedUnitId: '' as string | null,
      isBillable: true,
      isActive: true,
    },
    validate: {
      code: (v) => (v.trim().length < 1 ? 'Obligatorio' : null),
      unitType: (v) => (v.trim().length < 1 ? 'Obligatorio' : null),
      privateBuiltAreaM2: (v) => (Number(v) < 0 ? 'Debe ser ≥ 0' : null),
    },
  })

  const buildingOptions = useMemo(
    () => (buildings.data ?? []).map((b) => ({ value: b.id, label: b.name })),
    [buildings.data],
  )

  const floorsForBuilding = useMemo(
    () => (floors.data ?? []).filter((f) => !buildingId || f.buildingId === buildingId),
    [floors.data, buildingId],
  )

  const floorOptions = useMemo(
    () => floorsForBuilding.map((f) => ({ value: f.id, label: f.name })),
    [floorsForBuilding],
  )

  const formFloorOptions = useMemo(() => {
    const selectedBuilding = form.values.buildingId
    return (floors.data ?? [])
      .filter((f) => !selectedBuilding || f.buildingId === selectedBuilding)
      .map((f) => ({ value: f.id, label: f.name }))
  }, [floors.data, form.values.buildingId])

  const linkedUnitOptions = useMemo(() => {
    const editingId = drawer !== null && drawer !== 'create' ? drawer.id : null
    return (units.data ?? [])
      .filter((u) => u.id !== editingId && isDwelling(u.unitType))
      .map((u) => {
        const base = formatUnitOptionLabel(u, buildingById)
        const kind = normalizeUnitType(u.unitType) === 'House' ? 'Casa' : 'Apto'
        return { value: u.id, label: `${base} · ${kind}` }
      })
  }, [units.data, drawer, buildingById])

  const visibleUnits = useMemo(() => {
    return (units.data ?? []).filter((u) => {
      if (buildingId && u.buildingId !== buildingId) return false
      if (floorId && u.floorId !== floorId) return false
      return true
    })
  }, [units.data, buildingId, floorId])

  const previewCoefficient = useMemo(() => {
    const editingId = drawer !== null && drawer !== 'create' ? drawer.id : null
    const area = Number(form.values.privateBuiltAreaM2) || 0
    const others = (units.data ?? []).filter((u) => u.isActive && u.id !== editingId)
    const totalArea =
      others.reduce((sum, u) => sum + (Number(u.privateBuiltAreaM2) || 0), 0) + area
    if (totalArea <= 0) return 0
    return (area / totalArea) * 100
  }, [drawer, form.values.privateBuiltAreaM2, units.data])

  const openCreate = () => {
    form.setValues({
      code: '',
      unitType: 'Apartment',
      buildingId,
      floorId,
      privateBuiltAreaM2: 0,
      privateOpenAreaM2: null,
      contributionModuleCode: '',
      linkedUnitId: null,
      isBillable: true,
      isActive: true,
    })
    setDrawer('create')
  }

  const openEdit = (item: Unit) => {
    form.setValues({
      code: item.code,
      unitType: normalizeUnitType(item.unitType) ?? 'Apartment',
      buildingId: item.buildingId,
      floorId: item.floorId,
      privateBuiltAreaM2: item.privateBuiltAreaM2,
      privateOpenAreaM2: item.privateOpenAreaM2,
      contributionModuleCode: item.contributionModuleCode ?? '',
      linkedUnitId: item.linkedUnitId,
      isBillable: item.isBillable,
      isActive: item.isActive,
    })
    setDrawer(item)
  }

  const saveMutation = useMutation({
    mutationFn: async () => {
      const payload = {
        horizontalPropertyId: propertyId,
        code: form.values.code.trim(),
        unitType: form.values.unitType,
        buildingId: form.values.buildingId || null,
        floorId: form.values.floorId || null,
        privateBuiltAreaM2: Number(form.values.privateBuiltAreaM2) || 0,
        privateOpenAreaM2:
          form.values.privateOpenAreaM2 === null || form.values.privateOpenAreaM2 === undefined
            ? null
            : Number(form.values.privateOpenAreaM2),
        contributionModuleCode: form.values.contributionModuleCode.trim() || null,
        linkedUnitId: isAmenity(form.values.unitType) ? form.values.linkedUnitId || null : null,
        parkingCount: drawer !== 'create' && drawer ? drawer.parkingCount : 0,
        terraceCount: drawer !== 'create' && drawer ? drawer.terraceCount : 0,
        storageCount: drawer !== 'create' && drawer ? drawer.storageCount : 0,
        isDoubleParking: drawer !== 'create' && drawer ? drawer.isDoubleParking : false,
        isBillable: form.values.isBillable,
        isPaymentUpToDate: drawer !== 'create' && drawer ? drawer.isPaymentUpToDate : true,
      }
      if (drawer === 'create') {
        const { data } = await api.post<Unit>('/api/Units', payload)
        return data
      }
      const { data } = await api.put<Unit>(`/api/Units/${drawer!.id}`, {
        ...payload,
        isActive: form.values.isActive,
      })
      return data
    },
    onSuccess: () => {
      notifications.show({ title: 'Guardado', message: 'Unidad guardada', color: 'teal' })
      setDrawer(null)
      invalidate()
    },
    onError: (err) =>
      notifications.show({ title: 'Error', message: getApiErrorMessage(err), color: 'red' }),
  })

  const total = summaryQuery.data?.totalCoefficient
  const household = householdQuery.data

  return (
    <Stack gap="md">
      <Group justify="space-between" align="flex-start">
        <PageHeader
          title="Unidades"
          description="Elige bloque y piso para ver las unidades. En apartamentos y casas verás propietarios y habitantes."
        />
        <Button leftSection={<IconPlus size={16} />} onClick={openCreate}>
          Agregar unidad
        </Button>
      </Group>

      {structureQuery.data && !structureQuery.data.hasStructure ? (
        <Alert color="teal" title="Sin estructura">
          Primero genera bloques, pisos y unidades con el asistente.
          <div>
            <Button component={Link} to={`/properties/${propertyId}/estructura`} mt="sm" size="xs">
              Configurar estructura
            </Button>
          </div>
        </Alert>
      ) : null}

      {total !== undefined && (
        <Alert color="teal" title="Coeficientes por área">
          Total: <strong>{total.toFixed(2)}</strong>
          {summaryQuery.data ? ` en ${summaryQuery.data.unitCount} unidades` : null}
        </Alert>
      )}

      <Stack gap="xs">
        <Group gap={8} align="center">
          <ThemeIcon variant="light" color="teal" radius="md" size="sm">
            <IconBuilding size={14} />
          </ThemeIcon>
          <Text size="sm" fw={600}>
            Bloque
          </Text>
        </Group>
        <Group gap="xs" wrap="wrap">
          {(buildings.data ?? []).map((b) => (
            <UnstyledButton key={b.id} onClick={() => { setBuildingId(b.id); setFloorId(null) }}>
              <Badge
                size="lg"
                variant={buildingId === b.id ? 'filled' : 'light'}
                color="teal"
                style={{ cursor: 'pointer' }}
              >
                {b.name}
              </Badge>
            </UnstyledButton>
          ))}
          {(buildings.data?.length ?? 0) === 0 && (
            <Text size="sm" c="dimmed">
              No hay bloques. Crea uno en la sección Bloques.
            </Text>
          )}
        </Group>
      </Stack>

      {buildingId && (
        <Stack gap="xs">
          <Group gap={8} align="center">
            <ThemeIcon variant="light" color="blue" radius="md" size="sm">
              <IconLayersIntersect size={14} />
            </ThemeIcon>
            <Text size="sm" fw={600}>
              Piso
            </Text>
          </Group>
          <Group gap="xs" wrap="wrap">
            <UnstyledButton onClick={() => setFloorId(null)}>
              <Badge size="lg" variant={floorId === null ? 'filled' : 'light'} color="blue">
                Todos
              </Badge>
            </UnstyledButton>
            {floorsForBuilding.map((f) => (
              <UnstyledButton key={f.id} onClick={() => setFloorId(f.id)}>
                <Badge
                  size="lg"
                  variant={floorId === f.id ? 'filled' : 'light'}
                  color="blue"
                  style={{ cursor: 'pointer' }}
                >
                  {f.name}
                </Badge>
              </UnstyledButton>
            ))}
          </Group>
        </Stack>
      )}

      {units.isLoading ? (
        <Stack align="center" py="xl">
          <Loader />
        </Stack>
      ) : (
        <SimpleGrid cols={{ base: 1, xs: 2, sm: 3, md: 4 }} spacing="sm">
          {visibleUnits.map((unit) => {
            const dwelling = isDwelling(unit.unitType)
            return (
              <UnstyledButton
                key={unit.id}
                onClick={() => setSelectedUnit(unit)}
                style={{ textAlign: 'left' }}
              >
                <Paper
                  withBorder
                  p="md"
                  radius="lg"
                  style={{
                    height: '100%',
                    transition: 'transform 120ms ease, box-shadow 120ms ease',
                    background:
                      'light-dark(var(--mantine-color-gray-0), var(--mantine-color-dark-6))',
                  }}
                >
                  <Stack gap="xs">
                    <Group justify="space-between" wrap="nowrap">
                      <Group gap="xs">
                        <ThemeIcon variant="light" radius="md" color={dwelling ? 'teal' : 'gray'}>
                          {dwelling ? <IconUsers size={16} /> : <IconDoor size={16} />}
                        </ThemeIcon>
                        <Text fw={700}>{unit.code}</Text>
                      </Group>
                      <Badge size="sm" variant="light">
                        {labelForOption(UNIT_TYPE_OPTIONS, unit.unitType)}
                      </Badge>
                    </Group>
                    <Text size="xs" c="dimmed">
                      {Number(unit.privateBuiltAreaM2).toFixed(2)} m² · coef{' '}
                      {Number(unit.coefficient).toFixed(2)}
                    </Text>
                    {dwelling ? (
                      <Text size="xs" c="teal">
                        Ver habitantes →
                      </Text>
                    ) : (
                      <Text size="xs" c="dimmed">
                        Toca para ver detalle
                      </Text>
                    )}
                  </Stack>
                </Paper>
              </UnstyledButton>
            )
          })}
        </SimpleGrid>
      )}

      {!units.isLoading && visibleUnits.length === 0 && (
        <Text size="sm" c="dimmed">
          No hay unidades en esta selección.
        </Text>
      )}

      <FormDrawer
        opened={selectedUnit !== null}
        onClose={() => setSelectedUnit(null)}
        size="lg"
        title={
          selectedUnit
            ? `Unidad ${selectedUnit.code}`
            : 'Unidad'
        }
      >
        {selectedUnit && (
          <Stack gap="md">
            <Group gap="xs" wrap="wrap">
              <Badge variant="light">{labelForOption(UNIT_TYPE_OPTIONS, selectedUnit.unitType)}</Badge>
              <Badge variant="outline" color="gray">
                {Number(selectedUnit.privateBuiltAreaM2).toFixed(2)} m²
              </Badge>
              <Badge variant="outline" color="teal">
                Coef. {Number(selectedUnit.coefficient).toFixed(2)}
              </Badge>
            </Group>

            {isDwelling(selectedUnit.unitType) ? (
              householdQuery.isLoading ? (
                <Loader size="sm" />
              ) : household ? (
                <Stack gap="lg">
                  <Stack gap="xs">
                    <Text size="xs" c="dimmed" tt="uppercase" fw={700}>
                      Habitantes
                    </Text>
                    {household.habitants.length === 0 ? (
                      <Text size="sm" c="dimmed">
                        Sin habitantes registrados.
                      </Text>
                    ) : (
                      household.habitants.map((p) => (
                        <PersonChip key={`${p.personId}-${p.role}`} person={p} variant="habitant" />
                      ))
                    )}
                  </Stack>

                  {household.owners.length > 0 && (
                    <Stack gap="xs">
                      <Text size="xs" c="dimmed" tt="uppercase" fw={700}>
                        Propietario
                      </Text>
                      {household.owners.map((p) => (
                        <PersonChip key={`${p.personId}-${p.role}`} person={p} variant="owner" />
                      ))}
                    </Stack>
                  )}

                  <Text size="xs" c="dimmed">
                    {[household.buildingName, household.floorName].filter(Boolean).join(' · ')}
                  </Text>
                </Stack>
              ) : (
                <Text size="sm" c="dimmed">
                  No se pudo cargar el hogar.
                </Text>
              )
            ) : (
              <Text size="sm" c="dimmed">
                Esta unidad no es apartamento ni casa; el listado de habitantes aplica a viviendas.
              </Text>
            )}

            <Button variant="light" onClick={() => { openEdit(selectedUnit); setSelectedUnit(null) }}>
              Editar unidad
            </Button>
          </Stack>
        )}
      </FormDrawer>

      <FormDrawer
        opened={drawer !== null}
        onClose={() => setDrawer(null)}
        title={drawer === 'create' ? 'Nueva unidad' : 'Editar unidad'}
      >
        <form onSubmit={form.onSubmit(() => saveMutation.mutate())}>
          <Stack gap="sm">
            <TextInput label="Código" required {...form.getInputProps('code')} />
            <Select
              label="Tipo de unidad"
              required
              data={[...UNIT_TYPE_OPTIONS]}
              comboboxProps={formDrawerSelectComboboxProps}
              {...form.getInputProps('unitType')}
            />
            <Select
              label="Bloque"
              clearable
              searchable
              data={buildingOptions}
              comboboxProps={formDrawerSelectComboboxProps}
              value={form.values.buildingId}
              onChange={(v) => {
                form.setFieldValue('buildingId', v)
                form.setFieldValue('floorId', null)
              }}
            />
            <Select
              label="Piso"
              clearable
              searchable
              data={formFloorOptions.length ? formFloorOptions : floorOptions}
              disabled={!form.values.buildingId}
              comboboxProps={formDrawerSelectComboboxProps}
              value={form.values.floorId}
              onChange={(v) => form.setFieldValue('floorId', v)}
            />
            <NumberInput
              label="Área construida privada (m²)"
              description="Base del coeficiente de la unidad"
              decimalScale={2}
              min={0}
              required
              {...form.getInputProps('privateBuiltAreaM2')}
            />
            <NumberInput
              label="Área libre privada (m²)"
              decimalScale={2}
              value={form.values.privateOpenAreaM2 ?? ''}
              onChange={(v) =>
                form.setFieldValue('privateOpenAreaM2', typeof v === 'number' ? v : null)
              }
            />
            <Text size="sm">
              Coeficiente (auto): <strong>{previewCoefficient.toFixed(2)}</strong>
            </Text>
            <TextInput
              label="Código módulo de contribución"
              {...form.getInputProps('contributionModuleCode')}
            />
            {isAmenity(form.values.unitType) && (
              <Select
                label="Apartamento / casa asociado"
                description="Solo apartamentos o casas. Parqueaderos, terrazas y bodegas se vinculan a una vivienda."
                clearable
                searchable
                data={linkedUnitOptions}
                comboboxProps={formDrawerSelectComboboxProps}
                value={form.values.linkedUnitId}
                onChange={(v) => form.setFieldValue('linkedUnitId', v)}
              />
            )}
            <Switch label="Facturable" {...form.getInputProps('isBillable', { type: 'checkbox' })} />
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
