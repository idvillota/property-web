import { Navigate, Route, Routes } from 'react-router-dom'
import { AppLayout } from './app/layouts/AppLayout'
import { FeatureRoute } from './components/FeatureRoute'
import { ProtectedRoute } from './components/ProtectedRoute'
import { LoginPage } from './features/auth/pages/LoginPage'
import { RegisterPage } from './features/auth/pages/RegisterPage'
import { DashboardPage } from './features/dashboard/pages/DashboardPage'
import { DashboardSettingsPage } from './features/dashboard/pages/DashboardSettingsPage'
import { EmployeesPage } from './features/organization/pages/EmployeesPage'
import { RolePermissionsPage } from './features/organization/pages/RolePermissionsPage'
import { TeamInvitePage } from './features/organization/pages/TeamInvitePage'
import { TenantSettingsPage } from './features/settings/pages/TenantSettingsPage'
import { AppearanceSettingsPage } from './features/settings/pages/AppearanceSettingsPage'
import { PlatformStatusPage } from './features/platform/pages/PlatformStatusPage'
import { UserPreferencesBootstrap } from './components/theme/UserPreferencesBootstrap'
import { useAuthStore } from './stores/authStore'

function DefaultRedirect() {
  const token = useAuthStore((s) => s.token)
  return <Navigate to={token ? '/dashboard' : '/login'} replace />
}

export default function App() {
  return (
    <>
      <UserPreferencesBootstrap />
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />

        <Route element={<ProtectedRoute />}>
          <Route element={<FeatureRoute />}>
            <Route element={<AppLayout />}>
              <Route path="/" element={<Navigate to="/dashboard" replace />} />
              <Route path="/dashboard" element={<DashboardPage />} />
              <Route path="/settings/dashboard" element={<DashboardSettingsPage />} />
              <Route path="/employees" element={<EmployeesPage />} />
              <Route path="/team" element={<TeamInvitePage />} />
              <Route path="/role-permissions" element={<RolePermissionsPage />} />
              <Route path="/platform/status" element={<PlatformStatusPage />} />
              <Route path="/settings" element={<TenantSettingsPage />} />
              <Route path="/settings/appearance" element={<AppearanceSettingsPage />} />
            </Route>
          </Route>
        </Route>

        <Route path="*" element={<DefaultRedirect />} />
      </Routes>
    </>
  )
}
