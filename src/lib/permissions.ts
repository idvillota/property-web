/** Must match API FeatureCodes. */
export const FeatureCodes = {
  dashboardView: 'dashboard.view',
  dashboardConfigure: 'dashboard.configure',
  settingsTenant: 'settings.tenant',
  organizationEmployees: 'organization.employees',
  organizationTeam: 'organization.team',
  organizationRoles: 'organization.roles',
  structureNeighborhoods: 'structure.neighborhoods',
  structureProperties: 'structure.properties',
  structureBuildings: 'structure.buildings',
  structureFloors: 'structure.floors',
  structureUnits: 'structure.units',
  structureVehicleBrands: 'structure.vehicleBrands',
  peopleManage: 'people.manage',
  billingSettings: 'billing.settings',
  billingCharges: 'billing.charges',
  billingPayments: 'billing.payments',
  amenitiesAreas: 'amenities.areas',
  amenitiesReservations: 'amenities.reservations',
  receptionManage: 'reception.manage',
  receptionVisits: 'reception.visits',
  receptionIntercom: 'reception.intercom',
  muralManage: 'mural.manage',
  reportsView: 'reports.view',
  auditView: 'audit.view',
  portalAccess: 'portal.access',
  portalAccountRead: 'portal.account.read',
  portalReservations: 'portal.reservations',
  portalPay: 'portal.pay',
  portalMuralRead: 'portal.mural.read',
  portalVisits: 'portal.visits',
  pqrsCreate: 'pqrs.create',
  pqrsManage: 'pqrs.manage',
} as const

export type FeatureCode = (typeof FeatureCodes)[keyof typeof FeatureCodes]

export const ROLE_LABELS: Record<string, string> = {
  Administrator: 'Administrador',
  Owner: 'Propietario',
  Manager: 'Gerente',
  Receptionist: 'Recepcionista',
  Resident: 'Residente',
}

/** Spanish labels for API feature codes (UI only; codes stay English). */
export const FEATURE_LABELS: Record<string, string> = {
  'dashboard.view': 'Panel',
  'dashboard.configure': 'Configurar panel',
  'settings.tenant': 'Datos del conjunto',
  'organization.employees': 'Empleados',
  'organization.team': 'Equipo',
  'organization.roles': 'Roles y permisos',
  'structure.neighborhoods': 'Barrios',
  'structure.properties': 'Propiedades horizontales',
  'structure.buildings': 'Bloques',
  'structure.floors': 'Pisos',
  'structure.units': 'Unidades',
  'structure.vehicleBrands': 'Marcas de vehículos',
  'people.manage': 'Personas y ocupaciones',
  'billing.settings': 'Cuotas',
  'billing.charges': 'Periodos y cargos',
  'billing.payments': 'Pagos',
  'amenities.areas': 'Zonas comunes',
  'amenities.reservations': 'Reservas',
  'reception.manage': 'Portería',
  'reception.visits': 'Visitantes',
  'reception.intercom': 'Citofonía',
  'mural.manage': 'Mural',
  'reports.view': 'Reportes',
  'audit.view': 'Auditoría',
  'portal.access': 'Portal residentes',
  'portal.account.read': 'Estado de cuenta (portal)',
  'portal.reservations': 'Reservas (portal)',
  'portal.pay': 'Pagar PSE (portal)',
  'portal.mural.read': 'Mural (portal)',
  'portal.visits': 'Autorizar visitas (portal)',
  'pqrs.create': 'Crear PQRS (portal)',
  'pqrs.manage': 'Bandeja PQRS',
}

export const FEATURE_MODULE_LABELS: Record<string, string> = {
  Dashboard: 'Panel',
  Administration: 'Administración',
  Structure: 'Estructura',
  People: 'Personas',
  Billing: 'Facturación',
  Amenities: 'Amenidades',
  Reception: 'Portería',
  Community: 'Comunidad',
  Reports: 'Reportes',
  Portal: 'Portal',
}

export function featureLabel(code: string, fallbackName?: string) {
  return FEATURE_LABELS[code] ?? fallbackName ?? code
}

export function featureModuleLabel(module: string) {
  return FEATURE_MODULE_LABELS[module] ?? module
}

export function hasPermission(permissions: string[], code: string) {
  return permissions.includes(code)
}
