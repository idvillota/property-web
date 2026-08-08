import { ActionIcon, Badge, Card, Group, Stack, Text } from '@mantine/core'
import { IconEdit, IconFlask, IconTrash } from '@tabler/icons-react'
import type { ReactNode } from 'react'

type Props = {
  title: string
  subtitle?: string
  badges?: ReactNode
  meta?: ReactNode
  inactive?: boolean
  onEdit: () => void
  onDelete: () => void
  onRecipe?: () => void
}

export function EntityCard({ title, subtitle, badges, meta, inactive, onEdit, onDelete, onRecipe }: Props) {
  return (
    <Card withBorder radius="md" padding="md" opacity={inactive ? 0.65 : 1}>
      <Group justify="space-between" align="flex-start" wrap="nowrap">
        <Stack gap={4} style={{ flex: 1, minWidth: 0 }}>
          <Group gap="xs" wrap="wrap">
            <Text fw={600} size="sm" lineClamp={1}>
              {title}
            </Text>
            {inactive ? (
              <Badge size="xs" color="gray" variant="light">
                Inactivo
              </Badge>
            ) : null}
            {badges}
          </Group>
          {subtitle ? (
            <Text size="xs" c="dimmed" lineClamp={2}>
              {subtitle}
            </Text>
          ) : null}
          {meta}
        </Stack>
        <Group gap={6} wrap="nowrap">
          {onRecipe ? (
            <ActionIcon variant="light" color="teal" onClick={onRecipe} aria-label="Receta">
              <IconFlask size={18} stroke={1.75} />
            </ActionIcon>
          ) : null}
          <ActionIcon variant="light" color="amber" onClick={onEdit} aria-label="Editar">
            <IconEdit size={18} stroke={1.75} />
          </ActionIcon>
          <ActionIcon variant="light" color="red" onClick={onDelete} aria-label="Eliminar">
            <IconTrash size={18} stroke={1.75} />
          </ActionIcon>
        </Group>
      </Group>
    </Card>
  )
}
