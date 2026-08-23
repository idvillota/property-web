import { Center, Stack, Text, Title } from '@mantine/core'
import type { ReactNode } from 'react'
import { Navigate } from 'react-router-dom'
import { resolveDefaultLandingPath } from '../app/navConfig'
import { useCurrentProperty } from '../hooks/useCurrentProperty'
import { isTenantModuleEnabled } from '../features/settings/lib/tenantModuleFlags'
import type { FeatureCode } from '../lib/permissions'
import { useAuthStore } from '../stores/authStore'
import type { TenantModuleFlags } from '../api/types'

type FeatureGuardProps = {
  permission?: FeatureCode
  /** Allow access when the user holds any of these codes (REC-010). */
  anyOf?: FeatureCode[]
  /** Optional tenant module gate (DIFF-005 accounting, assemblies, PSE). */
  tenantModule?: keyof TenantModuleFlags
  children: ReactNode
}

export function FeatureGuard({ permission, anyOf, tenantModule, children }: FeatureGuardProps) {
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

  const moduleOk =
    !tenantModule || isTenantModuleEnabled(modules, tenantModule)

  if (!allowed || !moduleOk) {
    const fallback = resolveDefaultLandingPath(permissions, propertyId, isPlatformAdmin, modules)
    return (
      <>
        <Center mih="50vh">
          <Stack align="center" gap="xs" maw={360}>
            <Title order={3}>Acceso restringido</Title>
            <Text c="dimmed" ta="center">
              {!moduleOk
                ? 'Este módulo está desactivado para el tenant. Actívelo en Configuración.'
                : 'No tienes permiso para ver esta sección. Si crees que es un error, contacta al administrador del tenant.'}
            </Text>
          </Stack>
        </Center>
        <Navigate to={fallback} replace />
      </>
    )
  }

  return children
}
