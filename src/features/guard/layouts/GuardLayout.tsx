import { NavLink, Outlet, useLocation, Navigate } from 'react-router-dom'
import { IconPackage, IconUsers, IconCar } from '@tabler/icons-react'
import { FeatureCodes } from '../../../lib/permissions'
import { useAuthStore } from '../../../stores/authStore'
import { porterHubTabsRespectModuleFlags } from '../../reception/lib/porterHubTabsRespectModuleFlags'
import { guardShellRendersBottomNav } from '../lib/guardShellRendersBottomNav'
import './guard.css'

const TAB_META: Record<string, { label: string; icon: typeof IconPackage; to: string }> = {
  entregas: { label: 'Entregas', icon: IconPackage, to: '/guard/entregas' },
  visitas: { label: 'Visitas', icon: IconUsers, to: '/guard/visitas' },
  parking: { label: 'Parking', icon: IconCar, to: '/guard/parking' },
}

export function GuardLayout() {
  const hasPermission = useAuthStore((s) => s.hasPermission)
  const modules = useAuthStore((s) => s.modules)
  const location = useLocation()

  const canGuard =
    hasPermission(FeatureCodes.receptionManage) ||
    hasPermission(FeatureCodes.receptionVisits) ||
    hasPermission(FeatureCodes.visitorParking)

  if (!canGuard) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />
  }

  const tabIds = porterHubTabsRespectModuleFlags({
    visits: Boolean(modules?.visits),
    parking: hasPermission(FeatureCodes.visitorParking),
  })
  const tabs = tabIds.map((id) => ({
    id,
    label: TAB_META[id]!.label,
    to: TAB_META[id]!.to,
    icon: TAB_META[id]!.icon,
  }))
  void guardShellRendersBottomNav(tabs)

  return (
    <div className="guard-shell">
      <header className="guard-shell__header">
        <div className="guard-shell__brand">Portería</div>
      </header>
      <main className="guard-shell__main">
        <Outlet />
      </main>
      <nav className="guard-shell__nav" aria-label="Portería">
        {tabs.map((tab) => {
          const Icon = tab.icon
          return (
            <NavLink
              key={tab.id}
              to={tab.to}
              className={({ isActive }) =>
                `guard-shell__tab${isActive ? ' guard-shell__tab--active' : ''}`
              }
            >
              <Icon size={22} stroke={1.75} />
              <span>{tab.label}</span>
            </NavLink>
          )
        })}
      </nav>
    </div>
  )
}
