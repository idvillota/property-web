import { Center, Stack, Text, Title } from '@mantine/core'
import type { ReactNode } from 'react'
import { Navigate } from 'react-router-dom'
import type { FeatureCode } from '../lib/permissions'
import { useAuthStore } from '../stores/authStore'

type FeatureGuardProps = {
  permission: FeatureCode
  children: ReactNode
}

export function FeatureGuard({ permission, children }: FeatureGuardProps) {
  const hasPermission = useAuthStore((s) => s.hasPermission)

  if (!hasPermission(permission)) {
    return (
      <>
        <Center mih="50vh">
          <Stack align="center" gap="xs" maw={360}>
            <Title order={3}>Acceso restringido</Title>
            <Text c="dimmed" ta="center">
              You do not have permission to view this section. If you think this is a mistake, contact your tenant administrator.
            </Text>
          </Stack>
        </Center>
        <Navigate to="/dashboard" replace />
      </>
    )
  }

  return children
}
