import { Group, Stack, Text, Title } from '@mantine/core'
import type { ReactNode } from 'react'

export type PageHeaderProps = {
  title: string
  description?: ReactNode
  actions?: ReactNode
}

export function PageHeader({ title, description, actions }: PageHeaderProps) {
  return (
    <Group justify="space-between" align="flex-start" wrap="wrap" gap="sm">
      <Stack gap={4} style={{ flex: 1, minWidth: 0 }}>
        <Title order={2} size="h3">
          {title}
        </Title>
        {description ? (
          <Text c="dimmed" size="sm">
            {description}
          </Text>
        ) : null}
      </Stack>
      {actions ? (
        <Group gap="xs" wrap="wrap" style={{ flexShrink: 0 }}>
          {actions}
        </Group>
      ) : null}
    </Group>
  )
}
