import { Center, Stack, Text, Title } from '@mantine/core'
import type { ReactNode } from 'react'
import { Navigate } from 'react-router-dom'
import { resolveDefaultLandingPath } from '../app/navConfig'
import { useCurrentProperty } from '../hooks/useCurrentProperty'
import type { FeatureCode } from '../lib/permissions'
import { useAuthStore } from '../stores/authStore'

type FeatureGuardProps = {
  permission?: FeatureCode
  /** Allow access when the user holds any of these codes (REC-010). */
  anyOf?: FeatureCode[]
  children: ReactNode
}

export function FeatureGuard({ permission, anyOf, children }: FeatureGuardProps) {
  const hasPermission = useAuthStore((s) => s.hasPermission)
  const permissions = useAuthStore((s) => s.permissions)
  const isPlatformAdmin = useAuthStore((s) => s.isPlatformAdmin)
  const modules = useAuthStore((s) => s.modules)
  const propertyId = useCurrentProperty().data?.id ?? null

  const allowed = anyOf?.length
    ? anyOf.some((code) => hasPermission(code))
    : permission
      ? hasPermission(permission)
      : true

  if (!allowed) {
    const fallback = resolveDefaultLandingPath(permissions, propertyId, isPlatformAdmin, modules)
    return (
      <>
        <Center mih="50vh">
          <Stack align="center" gap="xs" maw={360}>
            <Title order={3}>Acceso restringido</Title>
            <Text c="dimmed" ta="center">
              No tienes permiso para ver esta sección. Si crees que es un error, contacta al administrador del tenant.
            </Text>
          </Stack>
        </Center>
        <Navigate to={fallback} replace />
      </>
    )
  }

  return children
}
