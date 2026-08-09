import { Avatar, Badge, Group, Stack, Text, ThemeIcon } from '@mantine/core'
import { IconHomeHeart, IconKey, IconUser } from '@tabler/icons-react'
import { labelForOption, OCCUPANCY_ROLE_OPTIONS } from '../../../lib/structureEnums'
import type { UnitHouseholdPerson } from '../../../api/types'

function initials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? '')
    .join('')
}

type Props = {
  person: UnitHouseholdPerson
  variant: 'owner' | 'habitant'
}

export function PersonChip({ person, variant }: Props) {
  const Icon = variant === 'owner' ? IconKey : person.role === 'Tenant' ? IconHomeHeart : IconUser
  const accent = variant === 'owner' ? 'teal' : 'blue'

  return (
    <Group
      gap="sm"
      wrap="nowrap"
      align="flex-start"
      p="sm"
      style={{
        borderRadius: 14,
        background: `light-dark(var(--mantine-color-${accent}-0), var(--mantine-color-dark-6))`,
        border: `1px solid light-dark(var(--mantine-color-${accent}-2), var(--mantine-color-dark-4))`,
      }}
    >
      <Avatar radius="xl" color={accent} variant="filled" size="md">
        {initials(person.fullName)}
      </Avatar>
      <Stack gap={4} style={{ flex: 1, minWidth: 0 }}>
        <Group gap={6} wrap="wrap">
          <Text fw={600} size="sm" lineClamp={1}>
            {person.fullName}
          </Text>
          <Badge size="xs" variant="light" color={accent} leftSection={<Icon size={12} />}>
            {labelForOption(OCCUPANCY_ROLE_OPTIONS, person.role)}
          </Badge>
          {person.isPrimary ? (
            <Badge size="xs" variant="outline" color="gray">
              Principal
            </Badge>
          ) : null}
        </Group>
        <Text size="xs" c="dimmed">
          {person.documentLabel}
        </Text>
        {(person.email || person.phone) && (
          <Group gap="xs" wrap="wrap">
            {person.phone ? (
              <Text size="xs" c="dimmed">
                {person.phone}
              </Text>
            ) : null}
            {person.email ? (
              <Text size="xs" c="dimmed" lineClamp={1}>
                {person.email}
              </Text>
            ) : null}
          </Group>
        )}
      </Stack>
      <ThemeIcon variant="light" color={accent} radius="xl" size="sm">
        <Icon size={14} />
      </ThemeIcon>
    </Group>
  )
}
