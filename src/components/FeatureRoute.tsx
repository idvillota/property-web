import { Outlet, useLocation } from 'react-router-dom'
import {
  isAnyOfPermission,
  isPlatformOnlyRoute,
  resolveRoutePermission,
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

  if (!requirement) {
    return <Outlet />
  }

  if (isAnyOfPermission(requirement)) {
    return (
      <FeatureGuard anyOf={requirement.anyOf}>
        <Outlet />
      </FeatureGuard>
    )
  }

  return (
    <FeatureGuard permission={requirement}>
      <Outlet />
    </FeatureGuard>
  )
}
