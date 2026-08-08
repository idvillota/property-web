import { Center, Stack, Text, Title } from '@mantine/core'
import type { ReactNode } from 'react'
import { Navigate } from 'react-router-dom'
import { useAuthStore } from '../stores/authStore'

type PlatformGuardProps = {
  children: ReactNode
}

export function PlatformGuard({ children }: PlatformGuardProps) {
  const isPlatformAdmin = useAuthStore((s) => s.isPlatformAdmin)

  if (!isPlatformAdmin) {
    return (
      <>
        <Center mih="50vh">
          <Stack align="center" gap="xs" maw={360}>
            <Title order={3}>Access restricted</Title>
            <Text c="dimmed" ta="center">
              This section is only for platform administrators.
            </Text>
          </Stack>
        </Center>
        <Navigate to="/dashboard" replace />
      </>
    )
  }

  return children
}
