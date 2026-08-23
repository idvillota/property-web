import { Center, Loader, Stack, Text } from '@mantine/core'
import { Navigate, Outlet } from 'react-router-dom'
import { FeatureCodes } from '../../lib/permissions'
import { useAuthStore } from '../../stores/authStore'

/** Guards /portal/* — token + portal module + portal.access + person link. */
export function PortalProtectedRoute() {
  const token = useAuthStore((s) => s.token)
  const modules = useAuthStore((s) => s.modules)
  const hasPermission = useAuthStore((s) => s.hasPermission)
  const hasPersonLink = useAuthStore((s) => s.hasPersonLink)

  if (!token) {
    return <Navigate to="/portal/login" replace />
  }

  if (modules && modules.portal === false) {
    return (
      <Center mih="60vh" px="md">
        <Stack maw={420} gap="xs">
          <Text fw={600}>Portal no disponible</Text>
          <Text c="dimmed" size="sm">
            El módulo Portal está desactivado para este conjunto.
          </Text>
        </Stack>
      </Center>
    )
  }

  if (!hasPermission(FeatureCodes.portalAccess) || !hasPersonLink) {
    return <Navigate to="/dashboard" replace />
  }

  return <Outlet />
}

export function PortalBootFallback() {
  return (
    <Center mih="40vh">
      <Loader color="teal" />
    </Center>
  )
}
