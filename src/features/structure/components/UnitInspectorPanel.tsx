import {
  ActionIcon,
  Badge,
  Button,
  Divider,
  Group,
  Menu,
  NumberInput,
  Select,
  SimpleGrid,
  Stack,
  Switch,
  Text,
  TextInput,
} from '@mantine/core'
import { notifications } from '@mantine/notifications'
import { IconDots, IconPencil, IconUserPlus } from '@tabler/icons-react'
import { useMutation } from '@tanstack/react-query'
import { useEffect, useState } from 'react'
import { api } from '../../../api/client'
import { getApiErrorMessage } from '../../../api/errors'
import type {
  StructureWorkspaceBuilding,
  StructureWorkspaceFloor,
  Unit,
  UnitHousehold,
  UnitHouseholdPerson,
} from '../../../api/types'
import { FormDrawer } from '../../../components/crud/FormDrawer'
import {
  labelForOption,
  normalizeUnitType,
  OCCUPANCY_ROLE_OPTIONS,
  UNIT_TYPE_OPTIONS,
} from '../../../lib/structureEnums'
import {
  UnitAmenityLinksPanel,
  UnitHostLinkField,
} from './UnitAmenityLinksPanel'
import { UnitPersonasPanel } from './UnitPersonasPanel'
import { UnitVehiclesPanel } from './UnitVehiclesPanel'
import { formatMoney } from '../../../lib/money'
import { unitInspectorShowsBalanceAndAmenities } from '../lib/unitInspectorShowsBalanceAndAmenities'

function isDwellingUnit(unitType: string | number | null | undefined) {
  const t = normalizeUnitType(unitType)
  return t === 'Apartment' || t === 'House'
}

function isLinkableAmenity(unitType: string | number | null | undefined) {
  const t = normalizeUnitType(unitType)
  return t === 'Parking' || t === 'Terrace' || t === 'Storage'
}

function canAssignOwner(unitType: string | number | null | undefined) {
  const t = normalizeUnitType(unitType)
  return t === 'Apartment' || t === 'House' || t === 'Parking'
}

function PersonRow({ person, kind }: { person: UnitHouseholdPerson; kind: string }) {
  return (
    <Group justify="space-between" wrap="nowrap" gap="sm" py={4}>
      <Group gap={8} wrap="nowrap" style={{ minWidth: 0 }}>
        <Text size="sm" fw={600} truncate>
          {person.fullName}
        </Text>
        <Badge size="xs" variant="light">
          {labelForOption(OCCUPANCY_ROLE_OPTIONS, person.role) || kind}
        </Badge>
        {person.isPrimary ? (
          <Badge size="xs" variant="outline" color="teal">
            Principal
          </Badge>
        ) : null}
      </Group>
      <Text size="xs" c="dimmed" truncate style={{ maxWidth: '40%' }}>
        {[person.documentLabel, person.phone].filter(Boolean).join(' · ')}
      </Text>
    </Group>
  )
}

type Selected = {
  unit: Unit
  floor: StructureWorkspaceFloor
  building: StructureWorkspaceBuilding
}

type Props = {
  propertyId: string
  selected: Selected
  household: UnitHousehold | undefined
  householdLoading: boolean
  onChanged: () => void
}

export function UnitInspectorPanel({
  propertyId,
  selected,
  household,
  householdLoading,
  onChanged,
}: Props) {
  const dwelling = isDwellingUnit(selected.unit.unitType)
  const personasAvailable = canAssignOwner(selected.unit.unitType)
  const parking = normalizeUnitType(selected.unit.unitType) === 'Parking'
  const amenity = isLinkableAmenity(selected.unit.unitType)

  const [editing, setEditing] = useState(false)
  const [personasOpen, setPersonasOpen] = useState(false)
  const [draft, setDraft] = useState({
    code: selected.unit.code,
    unitType: String(selected.unit.unitType),
    privateBuiltAreaM2: selected.unit.privateBuiltAreaM2,
    parkingCount: selected.unit.parkingCount ?? 0,
    terraceCount: selected.unit.terraceCount ?? 0,
    storageCount: selected.unit.storageCount ?? 0,
    isDoubleParking: selected.unit.isDoubleParking ?? false,
    isBillable: selected.unit.isBillable,
    isPaymentUpToDate: selected.unit.isPaymentUpToDate ?? true,
    isActive: selected.unit.isActive,
  })

  useEffect(() => {
    setEditing(false)
    setPersonasOpen(false)
    setDraft({
      code: selected.unit.code,
      unitType: String(selected.unit.unitType),
      privateBuiltAreaM2: selected.unit.privateBuiltAreaM2,
      parkingCount: selected.unit.parkingCount ?? 0,
      terraceCount: selected.unit.terraceCount ?? 0,
      storageCount: selected.unit.storageCount ?? 0,
      isDoubleParking: selected.unit.isDoubleParking ?? false,
      isBillable: selected.unit.isBillable,
      isPaymentUpToDate: selected.unit.isPaymentUpToDate ?? true,
      isActive: selected.unit.isActive,
    })
  }, [selected.unit.id])

  const saveMutation = useMutation({
    mutationFn: async () => {
      const { data } = await api.put<Unit>(`/api/Units/${selected.unit.id}`, {
        horizontalPropertyId: propertyId,
        buildingId: selected.unit.buildingId,
        floorId: selected.unit.floorId,
        code: draft.code.trim(),
        unitType: draft.unitType,
        privateBuiltAreaM2: draft.privateBuiltAreaM2,
        privateOpenAreaM2: selected.unit.privateOpenAreaM2,
        contributionModuleCode: selected.unit.contributionModuleCode,
        linkedUnitId: selected.unit.linkedUnitId,
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
      onChanged()
    },
    onError: (err) =>
      notifications.show({ title: 'Error', message: getApiErrorMessage(err), color: 'red' }),
  })

  const owners = household?.owners ?? []
  const habitants = household?.habitants ?? []
  const relatedParkings = household?.relatedParkings ?? []

  return (
    <>
      <Stack gap="md">
        <Group justify="space-between" align="flex-start" wrap="wrap">
          <div>
            <Group gap={8} wrap="wrap" align="center">
              <Text fw={700} size="xl">
                {editing ? draft.code : selected.unit.code}
              </Text>
              <Badge variant="light">
                {labelForOption(UNIT_TYPE_OPTIONS, selected.unit.unitType)}
              </Badge>
            </Group>
            <Text size="sm" c="dimmed">
              {selected.building.name} · {selected.floor.name}
            </Text>
          </div>
          {!editing && (
            <Menu shadow="sm" width={160} position="bottom-end">
              <Menu.Target>
                <ActionIcon variant="subtle" color="gray" aria-label="Acciones">
                  <IconDots size={18} stroke={1.75} />
                </ActionIcon>
              </Menu.Target>
              <Menu.Dropdown>
                <Menu.Item
                  leftSection={<IconPencil size={14} stroke={1.75} />}
                  onClick={() => setEditing(true)}
                >
                  Editar unidad
                </Menu.Item>
              </Menu.Dropdown>
            </Menu>
          )}
        </Group>

        {editing ? (
          <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="sm">
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
            <Group>
              <Button color="teal" loading={saveMutation.isPending} onClick={() => saveMutation.mutate()}>
                Guardar
              </Button>
              <Button variant="subtle" onClick={() => setEditing(false)}>
                Cancelar
              </Button>
            </Group>
          </SimpleGrid>
        ) : (
          <>
            <Group gap="lg" wrap="wrap">
              <div>
                <Text size="xs" c="dimmed">
                  Área
                </Text>
                <Text size="sm" fw={700}>
                  {selected.unit.privateBuiltAreaM2} m²
                </Text>
              </div>
              <div>
                <Text size="xs" c="dimmed">
                  Coeficiente
                </Text>
                <Text size="sm" fw={700}>
                  {selected.unit.coefficient.toFixed(2)}%
                </Text>
              </div>
              <div>
                <Text size="xs" c="dimmed">
                  Pagos
                </Text>
                <Badge
                  size="sm"
                  variant="light"
                  color={
                    (household?.openBalance ?? 0) > 0 || !selected.unit.isPaymentUpToDate
                      ? 'red'
                      : 'teal'
                  }
                >
                  {(household?.openBalance ?? 0) > 0
                    ? `Saldo ${formatMoney(household!.openBalance)}`
                    : selected.unit.isPaymentUpToDate
                      ? 'Al día'
                      : 'Pendiente'}
                </Badge>
              </div>
              {parking && (
                <div>
                  <Text size="xs" c="dimmed">
                    Cupo
                  </Text>
                  <Text size="sm" fw={600}>
                    {selected.unit.isDoubleParking ? 'Doble' : 'Sencillo'}
                  </Text>
                </div>
              )}
            </Group>

            {personasAvailable && (
              <Stack gap={6}>
                <Group justify="space-between">
                  <Text size="sm" fw={700}>
                    Personas
                  </Text>
                  <Button
                    size="compact-xs"
                    variant="light"
                    leftSection={<IconUserPlus size={14} />}
                    onClick={() => setPersonasOpen(true)}
                  >
                    Gestionar
                  </Button>
                </Group>
                {householdLoading ? (
                  <Text size="sm" c="dimmed">
                    Cargando…
                  </Text>
                ) : owners.length === 0 && (!dwelling || habitants.length === 0) ? (
                  <Text size="sm" c="dimmed">
                    Sin personas asignadas.
                  </Text>
                ) : (
                  <Stack gap={0}>
                    {owners.map((p) => (
                      <PersonRow key={p.occupancyId} person={p} kind="Propietario" />
                    ))}
                    {dwelling &&
                      habitants.map((p) => (
                        <PersonRow key={p.occupancyId} person={p} kind="Habitante" />
                      ))}
                  </Stack>
                )}
              </Stack>
            )}

            {(dwelling || amenity) && <Divider />}

            {dwelling && (
              <Stack gap="sm">
                <Text size="sm" fw={700}>
                  Parqueaderos, terrazas y bodegas
                </Text>
                <UnitAmenityLinksPanel
                  propertyId={propertyId}
                  dwelling={selected.unit}
                  household={household}
                  onChanged={onChanged}
                />
              </Stack>
            )}
            {void unitInspectorShowsBalanceAndAmenities({
              openBalance: household?.openBalance ?? 0,
              amenitiesVisible: dwelling,
            })}

            {amenity && (
              <Stack gap="sm">
                <Text size="sm" fw={700}>
                  Unidad anfitriona
                </Text>
                <UnitHostLinkField
                  propertyId={propertyId}
                  amenity={selected.unit}
                  onChanged={onChanged}
                />
              </Stack>
            )}

            {parking && (
              <Stack gap="sm">
                <Text size="sm" fw={700}>
                  Vehículos en este cupo
                </Text>
                <UnitVehiclesPanel
                  propertyId={propertyId}
                  parkingUnitId={selected.unit.id}
                  parkingCode={selected.unit.code}
                  isDoubleParking={selected.unit.isDoubleParking ?? false}
                />
              </Stack>
            )}

            {dwelling && relatedParkings.length > 0 && (
              <Stack gap="sm">
                <Text size="sm" fw={700}>
                  Vehículos en parqueaderos vinculados
                </Text>
                {relatedParkings.map((p) => (
                  <Stack key={p.unitId} gap={4}>
                    <Text size="sm" c="dimmed" fw={600}>
                      {p.code}
                    </Text>
                    <UnitVehiclesPanel
                      propertyId={propertyId}
                      parkingUnitId={p.unitId}
                      parkingCode={p.code}
                      isDoubleParking={false}
                    />
                  </Stack>
                ))}
              </Stack>
            )}
          </>
        )}
      </Stack>

      {personasAvailable && (
        <FormDrawer
          opened={personasOpen}
          onClose={() => setPersonasOpen(false)}
          title={`Gestionar personas · ${selected.unit.code}`}
          size="lg"
        >
          <UnitPersonasPanel
            unitId={selected.unit.id}
            household={household}
            householdLoading={householdLoading}
            showHabitants={dwelling}
            onChanged={onChanged}
          />
        </FormDrawer>
      )}
    </>
  )
}
