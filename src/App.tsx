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
import { AuditPage } from './features/organization/pages/AuditPage'
import { PlatformStatusPage } from './features/platform/pages/PlatformStatusPage'
import { CommonAreasPage } from './features/amenities/pages/CommonAreasPage'
import { ReservationsPage } from './features/amenities/pages/ReservationsPage'
import { BillingPeriodsPage } from './features/billing/pages/BillingPeriodsPage'
import { BillingSettingsPage } from './features/billing/pages/BillingSettingsPage'
import { FeeChargesPage } from './features/billing/pages/FeeChargesPage'
import { PaymentsPage } from './features/billing/pages/PaymentsPage'
import { PaymentIntentsPage } from './features/billing/pages/PaymentIntentsPage'
import { DunningPage } from './features/billing/pages/DunningPage'
import { MuralPage } from './features/community/pages/MuralPage'
import { PqrsInboxPage } from './features/community/pages/PqrsInboxPage'
import { ReceptionItemsPage } from './features/reception/pages/ReceptionItemsPage'
import { VisitorsPage } from './features/reception/pages/VisitorsPage'
import { CarteraReportPage } from './features/reports/pages/CarteraReportPage'
import { CoefficientsReportPage } from './features/reports/pages/CoefficientsReportPage'
import { CollectionsReportPage } from './features/reports/pages/CollectionsReportPage'
import { OccupancyReportPage } from './features/reports/pages/OccupancyReportPage'
import { ReceptionReportPage } from './features/reports/pages/ReceptionReportPage'
import { ReportsHubPage } from './features/reports/pages/ReportsHubPage'
import { ReservationUsageReportPage } from './features/reports/pages/ReservationUsageReportPage'
import { PropertyWorkspaceLayout } from './features/structure/layouts/PropertyWorkspaceLayout'
import { NeighborhoodsPage } from './features/structure/pages/NeighborhoodsPage'
import { VehicleBrandsPage } from './features/structure/pages/VehicleBrandsPage'
import { OccupanciesPage } from './features/structure/pages/OccupanciesPage'
import { PropertiesPage } from './features/structure/pages/PropertiesPage'
import { PropertyOverviewPage } from './features/structure/pages/PropertyOverviewPage'
import { StructureWorkspacePage } from './features/structure/pages/StructureWorkspacePage'
import { VehiclesPage } from './features/structure/pages/VehiclesPage'
import { PortalLayout } from './features/portal/layouts/PortalLayout'
import { PortalProtectedRoute } from './features/portal/PortalProtectedRoute'
import { PortalAccountPage } from './features/portal/pages/PortalAccountPage'
import { PortalPayPage } from './features/portal/pages/PortalPayPage'
import { PortalPayResultPage } from './features/portal/pages/PortalPayResultPage'
import { PortalReservationsPage } from './features/portal/pages/PortalReservationsPage'
import { PortalMuralPage } from './features/portal/pages/PortalMuralPage'
import { PortalPqrsPage } from './features/portal/pages/PortalPqrsPage'
import { PortalVisitsPage } from './features/portal/pages/PortalVisitsPage'
import { PortalHomePage } from './features/portal/pages/PortalHomePage'
import { PortalLoginPage } from './features/portal/pages/PortalLoginPage'
import { GuardLayout } from './features/guard/layouts/GuardLayout'
import { GuardDeliveriesPage } from './features/guard/pages/GuardDeliveriesPage'
import { GuardVisitsPage } from './features/guard/pages/GuardVisitsPage'
import { GuardParkingPage } from './features/guard/pages/GuardParkingPage'
import { ReceptionHubPage } from './features/reception/pages/ReceptionHubPage'
import { UserPreferencesBootstrap } from './components/theme/UserPreferencesBootstrap'
import { useAuthStore } from './stores/authStore'
import { FeatureCodes } from './lib/permissions'

function DefaultRedirect() {
  const token = useAuthStore((s) => s.token)
  const hasPersonLink = useAuthStore((s) => s.hasPersonLink)
  const hasPermission = useAuthStore((s) => s.hasPermission)
  const modules = useAuthStore((s) => s.modules)

  if (!token) return <Navigate to="/login" replace />
  if (modules.portal && hasPersonLink && hasPermission(FeatureCodes.portalAccess)) {
    return <Navigate to="/portal" replace />
  }
  return <Navigate to="/dashboard" replace />
}

export default function App() {
  return (
    <>
      <UserPreferencesBootstrap />
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/portal/login" element={<PortalLoginPage />} />

        <Route element={<PortalProtectedRoute />}>
          <Route element={<PortalLayout />}>
            <Route path="/portal" element={<PortalHomePage />} />
            <Route path="/portal/cuenta" element={<PortalAccountPage />} />
            <Route path="/portal/cuenta/pagar" element={<PortalPayPage />} />
            <Route path="/portal/cuenta/pagar/resultado" element={<PortalPayResultPage />} />
            <Route path="/portal/reservas" element={<PortalReservationsPage />} />
            <Route path="/portal/mural" element={<PortalMuralPage />} />
            <Route path="/portal/visitas" element={<PortalVisitsPage />} />
            <Route path="/portal/pqrs" element={<PortalPqrsPage />} />
            <Route path="/portal/pqrs/nuevo" element={<PortalPqrsPage />} />
          </Route>
        </Route>

        <Route element={<ProtectedRoute />}>
          <Route element={<GuardLayout />}>
            <Route path="/guard" element={<Navigate to="/guard/entregas" replace />} />
            <Route path="/guard/entregas" element={<GuardDeliveriesPage />} />
            <Route path="/guard/visitas" element={<GuardVisitsPage />} />
            <Route path="/guard/parking" element={<GuardParkingPage />} />
          </Route>
          <Route element={<FeatureRoute />}>
            <Route element={<AppLayout />}>
              <Route path="/" element={<Navigate to="/dashboard" replace />} />
              <Route path="/dashboard" element={<DashboardPage />} />
              <Route path="/settings/dashboard" element={<DashboardSettingsPage />} />
              <Route path="/neighborhoods" element={<NeighborhoodsPage />} />
              <Route path="/vehicle-brands" element={<VehicleBrandsPage />} />
              <Route path="/properties" element={<PropertiesPage />} />
              <Route path="/properties/:propertyId" element={<PropertyWorkspaceLayout />}>
                <Route index element={<PropertyOverviewPage />} />
                <Route path="estructura" element={<StructureWorkspacePage />} />
                <Route path="matriz" element={<Navigate to="../estructura" replace />} />
                <Route path="buildings" element={<Navigate to="../estructura" replace />} />
                <Route path="floors" element={<Navigate to="../estructura" replace />} />
                <Route path="units" element={<Navigate to="../estructura" replace />} />
                <Route path="occupancies" element={<OccupanciesPage />} />
                <Route path="vehicles" element={<VehiclesPage />} />
                <Route path="billing" element={<BillingSettingsPage />} />
                <Route path="periods" element={<BillingPeriodsPage />} />
                <Route path="charges" element={<FeeChargesPage />} />
                <Route path="payments" element={<PaymentsPage />} />
                <Route path="payment-intents" element={<PaymentIntentsPage />} />
                <Route path="billing/dunning" element={<DunningPage />} />
                <Route path="common-areas" element={<CommonAreasPage />} />
                <Route path="reservations" element={<ReservationsPage />} />
                <Route path="mural" element={<MuralPage />} />
                <Route path="pqrs" element={<PqrsInboxPage />} />
                <Route path="reception" element={<ReceptionItemsPage />} />
                <Route path="reception/hub" element={<Navigate to="entregas" replace />} />
                <Route path="reception/hub/:tab" element={<ReceptionHubPage />} />
                <Route path="reception/visitors" element={<VisitorsPage />} />
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
              <Route path="/settings/audit" element={<AuditPage />} />
            </Route>
          </Route>
        </Route>

        <Route path="*" element={<DefaultRedirect />} />
      </Routes>
    </>
  )
}
