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
import { PeoplePage } from './features/people/pages/PeoplePage'
import { TenantSettingsPage } from './features/settings/pages/TenantSettingsPage'
import { AppearanceSettingsPage } from './features/settings/pages/AppearanceSettingsPage'
import { PlatformStatusPage } from './features/platform/pages/PlatformStatusPage'
import { CommonAreasPage } from './features/amenities/pages/CommonAreasPage'
import { ReservationsPage } from './features/amenities/pages/ReservationsPage'
import { BillingPeriodsPage } from './features/billing/pages/BillingPeriodsPage'
import { BillingSettingsPage } from './features/billing/pages/BillingSettingsPage'
import { FeeChargesPage } from './features/billing/pages/FeeChargesPage'
import { PaymentsPage } from './features/billing/pages/PaymentsPage'
import { ReceptionItemsPage } from './features/reception/pages/ReceptionItemsPage'
import { CarteraReportPage } from './features/reports/pages/CarteraReportPage'
import { CoefficientsReportPage } from './features/reports/pages/CoefficientsReportPage'
import { CollectionsReportPage } from './features/reports/pages/CollectionsReportPage'
import { OccupancyReportPage } from './features/reports/pages/OccupancyReportPage'
import { ReceptionReportPage } from './features/reports/pages/ReceptionReportPage'
import { ReportsHubPage } from './features/reports/pages/ReportsHubPage'
import { ReservationUsageReportPage } from './features/reports/pages/ReservationUsageReportPage'
import { PropertyWorkspaceLayout } from './features/structure/layouts/PropertyWorkspaceLayout'
import { BuildingsPage } from './features/structure/pages/BuildingsPage'
import { FloorsPage } from './features/structure/pages/FloorsPage'
import { NeighborhoodsPage } from './features/structure/pages/NeighborhoodsPage'
import { OccupanciesPage } from './features/structure/pages/OccupanciesPage'
import { PropertiesPage } from './features/structure/pages/PropertiesPage'
import { PropertyOverviewPage } from './features/structure/pages/PropertyOverviewPage'
import { UnitsPage } from './features/structure/pages/UnitsPage'
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
              <Route path="/neighborhoods" element={<NeighborhoodsPage />} />
              <Route path="/properties" element={<PropertiesPage />} />
              <Route path="/properties/:propertyId" element={<PropertyWorkspaceLayout />}>
                <Route index element={<PropertyOverviewPage />} />
                <Route path="buildings" element={<BuildingsPage />} />
                <Route path="floors" element={<FloorsPage />} />
                <Route path="units" element={<UnitsPage />} />
                <Route path="occupancies" element={<OccupanciesPage />} />
                <Route path="billing" element={<BillingSettingsPage />} />
                <Route path="periods" element={<BillingPeriodsPage />} />
                <Route path="charges" element={<FeeChargesPage />} />
                <Route path="payments" element={<PaymentsPage />} />
                <Route path="common-areas" element={<CommonAreasPage />} />
                <Route path="reservations" element={<ReservationsPage />} />
                <Route path="reception" element={<ReceptionItemsPage />} />
                <Route path="reports" element={<ReportsHubPage />} />
                <Route path="reports/cartera" element={<CarteraReportPage />} />
                <Route path="reports/collections" element={<CollectionsReportPage />} />
                <Route path="reports/occupancy" element={<OccupancyReportPage />} />
                <Route path="reports/coefficients" element={<CoefficientsReportPage />} />
                <Route path="reports/reservations" element={<ReservationUsageReportPage />} />
                <Route path="reports/reception" element={<ReceptionReportPage />} />
              </Route>
              <Route path="/people" element={<PeoplePage />} />
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
