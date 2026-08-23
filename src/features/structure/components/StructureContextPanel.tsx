import { Badge, Button, Group, Menu, Stack, Text, UnstyledButton } from '@mantine/core'
import { IconPlus } from '@tabler/icons-react'
import type { StructureWorkspaceBuilding, StructureWorkspaceFloor, Unit } from '../../../api/types'
import { labelForOption, normalizeUnitType, UNIT_TYPE_OPTIONS } from '../../../lib/structureEnums'

export type UnitTypeBreakdown = { type: string; label: string; count: number }

export function summarizeUnits(units: Unit[]) {
  const counts = new Map<string, number>()
  let areaM2 = 0
  for (const u of units) {
    const type = normalizeUnitType(u.unitType) ?? String(u.unitType)
    counts.set(type, (counts.get(type) ?? 0) + 1)
    areaM2 += Number(u.privateBuiltAreaM2) || 0
  }
  const breakdown: UnitTypeBreakdown[] = [...counts.entries()]
    .map(([type, count]) => ({
      type,
      label: labelForOption(UNIT_TYPE_OPTIONS, type) || type,
      count,
    }))
    .sort((a, b) => b.count - a.count || a.label.localeCompare(b.label, 'es'))
  return { total: units.length, areaM2, breakdown }
}

function StatRow({ label, value }: { label: string; value: string }) {
  return (
    <Group justify="space-between" gap="xs" wrap="nowrap">
      <Text size="sm" c="dimmed">
        {label}
      </Text>
      <Text size="sm" fw={600} ta="right">
        {value}
      </Text>
    </Group>
  )
}

function BreakdownList({ breakdown }: { breakdown: UnitTypeBreakdown[] }) {
  if (breakdown.length === 0) {
    return (
      <Text size="sm" c="dimmed">
        Sin unidades todavía.
      </Text>
    )
  }
  return (
    <Stack gap={6}>
      {breakdown.map((row) => (
        <Group key={row.type} justify="space-between" gap="xs">
          <Badge size="sm" variant="light">
            {row.label}
          </Badge>
          <Text size="sm" fw={600}>
            {row.count}
          </Text>
        </Group>
      ))}
    </Stack>
  )
}

type AddUnitMenuProps = {
  loading?: boolean
  onAdd: (unitType: string) => void
}

function AddUnitMenu({ loading, onAdd }: AddUnitMenuProps) {
  return (
    <Menu shadow="sm" width={200}>
      <Menu.Target>
        <Button
          fullWidth
          size="compact-sm"
          color="teal"
          leftSection={<IconPlus size={14} />}
          loading={loading}
        >
          Unidad
        </Button>
      </Menu.Target>
      <Menu.Dropdown>
        <Menu.Item onClick={() => onAdd('Apartment')}>Apartamento</Menu.Item>
        <Menu.Item onClick={() => onAdd('House')}>Casa</Menu.Item>
        <Menu.Divider />
        <Menu.Item onClick={() => onAdd('Parking')}>Parqueadero</Menu.Item>
        <Menu.Item onClick={() => onAdd('Terrace')}>Terraza</Menu.Item>
        <Menu.Item onClick={() => onAdd('Storage')}>Bodega</Menu.Item>
      </Menu.Dropdown>
    </Menu>
  )
}

type BuildingPanelProps = {
  building: StructureWorkspaceBuilding
  onSelectFloor: (floorId: string) => void
  onAddFloor: () => void
  addFloorLoading?: boolean
}

export function BuildingContextPanel({
  building,
  onSelectFloor,
  onAddFloor,
  addFloorLoading,
}: BuildingPanelProps) {
  const units = building.floors.flatMap((f) => f.units)
  const summary = summarizeUnits(units)
  const floorsSorted = [...building.floors].sort((a, b) => (b.number ?? 0) - (a.number ?? 0))

  return (
    <Stack gap="sm">
      <div>
        <Text fw={700} size="lg">
          {building.name}
        </Text>
        <Text size="sm" c="dimmed">
          {building.code ? `Código ${building.code}` : 'Bloque'}
        </Text>
      </div>

      <StatRow label="Pisos" value={String(building.floors.length)} />
      <StatRow label="Unidades" value={String(summary.total)} />
      <StatRow
        label="Área privada"
        value={`${summary.areaM2.toLocaleString('es-CO', { maximumFractionDigits: 1 })} m²`}
      />

      <Text size="xs" c="dimmed" fw={600} tt="uppercase">
        Por tipo
      </Text>
      <BreakdownList breakdown={summary.breakdown} />

      <Text size="xs" c="dimmed" fw={600} tt="uppercase">
        Pisos
      </Text>
      <Stack gap={6}>
        {floorsSorted.length === 0 ? (
          <Text size="sm" c="dimmed">
            Este bloque aún no tiene pisos.
          </Text>
        ) : (
          floorsSorted.map((f) => (
            <UnstyledButton
              key={f.id}
              onClick={() => onSelectFloor(f.id)}
              p="sm"
              style={{
                borderRadius: 8,
                border: '1px solid var(--mantine-color-gray-3)',
                textAlign: 'left',
              }}
            >
              <Group justify="space-between" wrap="nowrap">
                <div>
                  <Text size="sm" fw={600}>
                    {f.name}
                  </Text>
                  <Text size="xs" c="dimmed">
                    {f.number != null ? `Nº ${f.number}` : 'Sin número'}
                  </Text>
                </div>
                <Text size="sm" c="dimmed">
                  {f.units.length} uds
                </Text>
              </Group>
            </UnstyledButton>
          ))
        )}
      </Stack>

      <Button
        variant="light"
        leftSection={<IconPlus size={14} />}
        onClick={onAddFloor}
        loading={addFloorLoading}
      >
        Agregar piso
      </Button>
    </Stack>
  )
}

type FloorPanelProps = {
  building: StructureWorkspaceBuilding
  floor: StructureWorkspaceFloor
  onAddUnit: (unitType: string) => void
  addUnitLoading?: boolean
}

export function FloorContextPanel({
  building,
  floor,
  onAddUnit,
  addUnitLoading,
}: FloorPanelProps) {
  const summary = summarizeUnits(floor.units)

  return (
    <Stack gap="sm">
      <div>
        <Text fw={700} size="lg">
          {floor.name}
        </Text>
        <Text size="sm" c="dimmed">
          {building.name}
          {floor.number != null ? ` · Nº ${floor.number}` : ''}
        </Text>
      </div>

      <StatRow label="Unidades" value={String(summary.total)} />
      <StatRow
        label="Área privada"
        value={`${summary.areaM2.toLocaleString('es-CO', { maximumFractionDigits: 1 })} m²`}
      />

      <Text size="xs" c="dimmed" fw={600} tt="uppercase">
        Composición
      </Text>
      <BreakdownList breakdown={summary.breakdown} />

      <AddUnitMenu loading={addUnitLoading} onAdd={onAddUnit} />
    </Stack>
  )
}
