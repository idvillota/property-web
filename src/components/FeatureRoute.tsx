import { Outlet, useLocation } from 'react-router-dom'
import {
  isAnyOfPermission,
  isPlatformOnlyRoute,
  resolveRoutePermission,
  resolveRouteTenantModule,
} from '../app/routePermissions'
import { FeatureGuard } from './FeatureGuard'
import { PlatformGuard } from './PlatformGuard'

export function FeatureRoute() {
  const { pathname } = useLocation()

  if (isPlatformOnlyRoute(pathname)) {
    return (
      <PlatformGuard>
        <Outlet />
      </PlatformGuard>
    )
  }

  const requirement = resolveRoutePermission(pathname)
  const tenantModule = resolveRouteTenantModule(pathname)

  if (!requirement && !tenantModule) {
    return <Outlet />
  }

  if (requirement && isAnyOfPermission(requirement)) {
    return (
      <FeatureGuard anyOf={requirement.anyOf} tenantModule={tenantModule ?? undefined}>
        <Outlet />
      </FeatureGuard>
    )
  }

  return (
    <FeatureGuard
      permission={requirement && !isAnyOfPermission(requirement) ? requirement : undefined}
      tenantModule={tenantModule ?? undefined}
    >
      <Outlet />
    </FeatureGuard>
  )
}
