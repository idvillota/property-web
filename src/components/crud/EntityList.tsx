import { Center, Loader, Stack, Text } from '@mantine/core'
import type { ReactNode } from 'react'

type Props = {
  loading: boolean
  empty: boolean
  emptyMessage?: string
  children: ReactNode
}

export function EntityList({ loading, empty, emptyMessage = 'Aún no hay registros.', children }: Props) {
  if (loading) {
    return (
      <Center py="xl">
        <Loader size="sm" />
      </Center>
    )
  }
  if (empty) {
    return (
      <Center py="xl">
        <Text c="dimmed" size="sm">
          {emptyMessage}
        </Text>
      </Center>
    )
  }
  return <Stack gap="sm">{children}</Stack>
}
