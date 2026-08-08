import { Outlet, useLocation } from 'react-router-dom'
import { isPlatformOnlyRoute, resolveRoutePermission } from '../app/routePermissions'
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

  const permission = resolveRoutePermission(pathname)

  if (!permission) {
    return <Outlet />
  }

  return (
    <FeatureGuard permission={permission}>
      <Outlet />
    </FeatureGuard>
  )
}
