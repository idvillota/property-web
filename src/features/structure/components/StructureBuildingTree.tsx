import { ActionIcon, Group, Stack, Text, UnstyledButton } from '@mantine/core'
import { IconChevronDown, IconChevronRight, IconPlus } from '@tabler/icons-react'
import type { StructureWorkspaceBuilding } from '../../../api/types'

type Props = {
  buildings: StructureWorkspaceBuilding[]
  buildingId: string
  floorId: string | 'all'
  expandedIds: string[]
  onToggleExpand: (buildingId: string) => void
  onSelectBuilding: (buildingId: string) => void
  onSelectFloor: (buildingId: string, floorId: string) => void
  onAddBuilding: () => void
  addBuildingLoading?: boolean
}

export function StructureBuildingTree({
  buildings,
  buildingId,
  floorId,
  expandedIds,
  onToggleExpand,
  onSelectBuilding,
  onSelectFloor,
  onAddBuilding,
  addBuildingLoading,
}: Props) {
  return (
    <Stack gap={6}>
      <Group justify="space-between" mb={4}>
        <Text fw={600} size="sm">
          Bloques
        </Text>
        <ActionIcon
          variant="subtle"
          color="teal"
          onClick={onAddBuilding}
          loading={addBuildingLoading}
          aria-label="Agregar bloque"
        >
          <IconPlus size={16} />
        </ActionIcon>
      </Group>

      {buildings.map((b) => {
        const expanded = expandedIds.includes(b.id)
        const selectedBuilding = b.id === buildingId
        const unitCount = b.floors.reduce((s, f) => s + f.units.length, 0)
        const floorsSorted = [...b.floors].sort((a, c) => (c.number ?? 0) - (a.number ?? 0))

        return (
          <Stack key={b.id} gap={4}>
            <Group gap={4} wrap="nowrap" align="stretch">
              <ActionIcon
                variant="subtle"
                color="gray"
                size="sm"
                onClick={() => onToggleExpand(b.id)}
                aria-label={expanded ? 'Colapsar' : 'Expandir'}
                style={{ marginTop: 6 }}
              >
                {expanded ? <IconChevronDown size={14} /> : <IconChevronRight size={14} />}
              </ActionIcon>
              <UnstyledButton
                onClick={() => onSelectBuilding(b.id)}
                p="sm"
                style={{
                  flex: 1,
                  borderRadius: 8,
                  border: selectedBuilding && floorId === 'all'
                    ? '1.5px solid var(--mantine-color-teal-6)'
                    : selectedBuilding
                      ? '1px solid var(--mantine-color-teal-4)'
                      : '1px solid var(--mantine-color-gray-3)',
                  background:
                    selectedBuilding && floorId === 'all'
                      ? 'var(--mantine-color-teal-0)'
                      : selectedBuilding
                        ? 'light-dark(var(--mantine-color-teal-0), transparent)'
                        : 'transparent',
                  textAlign: 'left',
                }}
              >
                <Text size="sm" fw={600}>
                  {b.name}
                </Text>
                <Text size="xs" c="dimmed">
                  {b.floors.length} pisos · {unitCount} uds
                </Text>
              </UnstyledButton>
            </Group>

            {expanded && (
              <Stack gap={2} pl={28}>
                {floorsSorted.length === 0 ? (
                  <Text size="xs" c="dimmed" pl="sm">
                    Sin pisos
                  </Text>
                ) : (
                  floorsSorted.map((f) => {
                    const active = b.id === buildingId && floorId === f.id
                    return (
                      <UnstyledButton
                        key={f.id}
                        onClick={() => onSelectFloor(b.id, f.id)}
                        px="sm"
                        py={6}
                        style={{
                          borderRadius: 6,
                          background: active ? 'var(--mantine-color-teal-0)' : 'transparent',
                          border: active
                            ? '1px solid var(--mantine-color-teal-5)'
                            : '1px solid transparent',
                          textAlign: 'left',
                        }}
                      >
                        <Group justify="space-between" wrap="nowrap" gap={6}>
                          <Text size="sm" fw={active ? 600 : 500}>
                            {f.name}
                          </Text>
                          <Text size="xs" c="dimmed">
                            {f.units.length}
                          </Text>
                        </Group>
                      </UnstyledButton>
                    )
                  })
                )}
              </Stack>
            )}
          </Stack>
        )
      })}
    </Stack>
  )
}
