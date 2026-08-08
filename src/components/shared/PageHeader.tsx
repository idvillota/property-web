import { Group, Stack, Text, Title } from '@mantine/core'
import type { ReactNode } from 'react'

type Props = {
  title: string
  description?: ReactNode
  actions?: ReactNode
}

export function PageHeader({ title, description, actions }: Props) {
  return (
    <Group justify="space-between" align="flex-start" wrap="nowrap" gap="sm">
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
      {actions ? <Group gap="xs" wrap="nowrap">{actions}</Group> : null}
    </Group>
  )
}
