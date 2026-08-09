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
  peopleManage: 'people.manage',
  billingSettings: 'billing.settings',
  billingCharges: 'billing.charges',
  billingPayments: 'billing.payments',
  amenitiesAreas: 'amenities.areas',
  amenitiesReservations: 'amenities.reservations',
  receptionManage: 'reception.manage',
  reportsView: 'reports.view',
} as const

export type FeatureCode = (typeof FeatureCodes)[keyof typeof FeatureCodes]

export const ROLE_LABELS: Record<string, string> = {
  Administrator: 'Administrador',
  Owner: 'Propietario',
  Manager: 'Gerente',
}

/** Spanish labels for API feature codes (UI only; codes stay English). */
export const FEATURE_LABELS: Record<string, string> = {
  'dashboard.view': 'Panel',
  'dashboard.configure': 'Configurar panel',
  'settings.tenant': 'Configuración de la propiedad',
  'organization.employees': 'Empleados',
  'organization.team': 'Invitar equipo',
  'organization.roles': 'Roles y permisos',
  'structure.neighborhoods': 'Barrios',
  'structure.properties': 'Propiedades horizontales',
  'structure.buildings': 'Bloques',
  'structure.floors': 'Pisos',
  'structure.units': 'Unidades',
  'people.manage': 'Personas y ocupaciones',
  'billing.settings': 'Configuración de cuotas',
  'billing.charges': 'Periodos y cargos',
  'billing.payments': 'Pagos',
  'amenities.areas': 'Zonas comunes',
  'amenities.reservations': 'Reservas',
  'reception.manage': 'Portería',
  'reports.view': 'Reportes',
}

export const FEATURE_MODULE_LABELS: Record<string, string> = {
  Dashboard: 'Panel',
  Administration: 'Administración',
  Structure: 'Estructura',
  People: 'Personas',
  Billing: 'Facturación',
  Amenities: 'Amenidades',
  Reception: 'Portería',
  Reports: 'Reportes',
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
