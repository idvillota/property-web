import {
  IconCalendarCheck,
  IconCalendarEvent,
  IconCar,
  IconCash,
  IconChartBar,
  IconCreditCard,
  IconHome,
  IconIdBadge,
  IconLayoutDashboard,
  IconLayoutGrid,
  IconMapPin,
  IconMessageCircle,
  IconPackage,
  IconPalette,
  IconPool,
  IconReceipt,
  IconScale,
  IconServer,
  IconSettings,
  IconShieldLock,
  IconSitemap,
  IconSpeakerphone,
  IconUserPlus,
  IconUsers,
  IconUsersGroup,
} from '@tabler/icons-react'
import type { TablerIcon } from '@tabler/icons-react'
import type { TenantModuleFlags } from '../api/types'
import { FeatureCodes } from '../lib/permissions'
import { isTenantModuleEnabled } from '../features/settings/lib/tenantModuleFlags'

export type NavAreaId =
  | 'inicio'
  | 'porteria'
  | 'cartera'
  | 'contabilidad'
  | 'asambleas'
  | 'comunidad'
  | 'copropiedad'
  | 'reportes'
  | 'administracion'

export type TenantModuleNavKey = keyof TenantModuleFlags

export type AppNavLeaf = {
  kind: 'link'
  id: string
  to: string
  label: string
  icon: TablerIcon
  /** Required single permission (ignored if permissionsAnyOf is set). */
  permission?: string
  /** Show link when the user has any of these permissions. */
  permissionsAnyOf?: string[]
  platformAdmin?: boolean
  /** ARCH-002 — hide when tenant module flag is off. */
  tenantModule?: TenantModuleNavKey
  /** When true, link is disabled until the tenant property id is known. */
  requiresProperty?: boolean
  /** Match active state for nested property routes. */
  activeMatch?: 'exact' | 'prefix'
}

export type AppNavSection = {
  kind: 'section'
  area: NavAreaId
  label: string
}

export type AppNavItem = AppNavSection | AppNavLeaf

export function propertyPath(propertyId: string | null | undefined, suffix = ''): string {
  if (!propertyId) return '/properties'
  if (!suffix) return `/properties/${propertyId}`
  return `/properties/${propertyId}/${suffix}`
}

export function buildAppNav(propertyId: string | null | undefined): AppNavItem[] {
  const ready = Boolean(propertyId)
  const p = (suffix = '') => propertyPath(propertyId, suffix)

  return [
    {
      kind: 'link',
      id: 'inicio',
      to: '/dashboard',
      label: 'Inicio',
      icon: IconLayoutDashboard,
      permission: FeatureCodes.dashboardView,
      activeMatch: 'exact',
    },

    { kind: 'section', area: 'porteria', label: 'Portería' },
    {
      kind: 'link',
      id: 'porteria-entregas',
      to: p('reception/hub/entregas'),
      label: 'Portería',
      icon: IconPackage,
      permissionsAnyOf: [FeatureCodes.receptionManage, FeatureCodes.receptionVisits],
      requiresProperty: true,
      activeMatch: 'prefix',
    },
    {
      kind: 'link',
      id: 'porteria-guard',
      to: '/guard',
      label: 'Modo vigilador',
      icon: IconIdBadge,
      permissionsAnyOf: [FeatureCodes.receptionManage, FeatureCodes.receptionVisits],
      requiresProperty: false,
      activeMatch: 'prefix',
    },

    { kind: 'section', area: 'cartera', label: 'Cartera' },
    {
      kind: 'link',
      id: 'cartera-cuotas',
      to: p('billing'),
      label: 'Cuotas',
      icon: IconCash,
      permission: FeatureCodes.billingSettings,
      requiresProperty: true,
      activeMatch: 'prefix',
    },
    {
      kind: 'link',
      id: 'cartera-periodos',
      to: p('periods'),
      label: 'Liquidación',
      icon: IconCalendarEvent,
      permission: FeatureCodes.billingCharges,
      requiresProperty: true,
      activeMatch: 'prefix',
    },
    {
      kind: 'link',
      id: 'cartera-cargos',
      to: p('charges'),
      label: 'Cargos',
      icon: IconReceipt,
      permission: FeatureCodes.billingCharges,
      requiresProperty: true,
      activeMatch: 'prefix',
    },
    {
      kind: 'link',
      id: 'cartera-pagos',
      to: p('payments'),
      label: 'Pagos',
      icon: IconCreditCard,
      permission: FeatureCodes.billingPayments,
      requiresProperty: true,
      activeMatch: 'prefix',
    },
    {
      kind: 'link',
      id: 'cartera-intents',
      to: p('payment-intents'),
      label: 'Intents PSE',
      icon: IconCreditCard,
      permission: FeatureCodes.billingPayments,
      requiresProperty: true,
      activeMatch: 'prefix',
    },
    {
      kind: 'link',
      id: 'cartera-dunning',
      to: p('billing/dunning'),
      label: 'Cobranza',
      icon: IconReceipt,
      permission: FeatureCodes.billingCharges,
      requiresProperty: true,
      activeMatch: 'prefix',
    },

    { kind: 'section', area: 'contabilidad', label: 'Contabilidad' },
    {
      kind: 'link',
      id: 'contabilidad-hub',
      to: '/accounting',
      label: 'Contabilidad',
      icon: IconScale,
      permission: FeatureCodes.dashboardView,
      tenantModule: 'accounting',
      activeMatch: 'prefix',
    },

    { kind: 'section', area: 'asambleas', label: 'Asambleas' },
    {
      kind: 'link',
      id: 'asambleas-hub',
      to: '/assemblies',
      label: 'Asambleas',
      icon: IconSpeakerphone,
      permission: FeatureCodes.dashboardView,
      tenantModule: 'assemblies',
      activeMatch: 'prefix',
    },

    { kind: 'section', area: 'comunidad', label: 'Comunidad' },
    {
      kind: 'link',
      id: 'comunidad-zonas',
      to: p('common-areas'),
      label: 'Zonas comunes',
      icon: IconPool,
      permission: FeatureCodes.amenitiesAreas,
      requiresProperty: true,
      activeMatch: 'prefix',
    },
    {
      kind: 'link',
      id: 'comunidad-reservas',
      to: p('reservations'),
      label: 'Reservas',
      icon: IconCalendarCheck,
      permission: FeatureCodes.amenitiesReservations,
      requiresProperty: true,
      activeMatch: 'prefix',
    },
    {
      kind: 'link',
      id: 'comunidad-mural',
      to: p('mural'),
      label: 'Mural',
      icon: IconMessageCircle,
      permission: FeatureCodes.muralManage,
      requiresProperty: true,
      activeMatch: 'prefix',
    },
    {
      kind: 'link',
      id: 'comunidad-pqrs',
      to: p('pqrs'),
      label: 'PQRS',
      icon: IconSpeakerphone,
      permission: FeatureCodes.pqrsManage,
      requiresProperty: true,
      activeMatch: 'prefix',
    },

    { kind: 'section', area: 'copropiedad', label: 'Copropiedad' },
    {
      kind: 'link',
      id: 'copropiedad-resumen',
      // Hub for create-or-redirect when property is missing.
      to: ready ? p() : '/properties',
      label: 'Resumen',
      icon: IconHome,
      permission: FeatureCodes.structureProperties,
      activeMatch: 'exact',
    },
    {
      kind: 'link',
      id: 'copropiedad-estructura',
      to: p('estructura'),
      label: 'Edificios y unidades',
      icon: IconSitemap,
      permission: FeatureCodes.structureBuildings,
      requiresProperty: true,
      activeMatch: 'prefix',
    },
    {
      kind: 'link',
      id: 'copropiedad-ocupaciones',
      to: p('occupancies'),
      label: 'Personas y ocupaciones',
      icon: IconUsersGroup,
      permission: FeatureCodes.peopleManage,
      requiresProperty: true,
      activeMatch: 'prefix',
    },
    {
      kind: 'link',
      id: 'copropiedad-vehiculos',
      to: p('vehicles'),
      label: 'Vehículos',
      icon: IconCar,
      permission: FeatureCodes.structureUnits,
      requiresProperty: true,
      activeMatch: 'prefix',
    },
    {
      kind: 'link',
      id: 'copropiedad-directorio',
      to: '/people',
      label: 'Directorio de personas',
      icon: IconUsers,
      permission: FeatureCodes.peopleManage,
      activeMatch: 'prefix',
    },

    { kind: 'section', area: 'reportes', label: 'Reportes' },
    {
      kind: 'link',
      id: 'reportes-hub',
      to: p('reports'),
      label: 'Centro de reportes',
      icon: IconChartBar,
      permission: FeatureCodes.reportsView,
      requiresProperty: true,
      activeMatch: 'prefix',
    },

    { kind: 'section', area: 'administracion', label: 'Administración' },
    {
      kind: 'link',
      id: 'admin-barrios',
      to: '/neighborhoods',
      label: 'Barrios',
      icon: IconMapPin,
      permission: FeatureCodes.structureNeighborhoods,
      activeMatch: 'prefix',
    },
    {
      kind: 'link',
      id: 'admin-marcas',
      to: '/vehicle-brands',
      label: 'Marcas de vehículos',
      icon: IconCar,
      permission: FeatureCodes.structureVehicleBrands,
      activeMatch: 'prefix',
    },
    {
      kind: 'link',
      id: 'admin-empleados',
      to: '/employees',
      label: 'Empleados',
      icon: IconIdBadge,
      permission: FeatureCodes.organizationEmployees,
      activeMatch: 'prefix',
    },
    {
      kind: 'link',
      id: 'admin-equipo',
      to: '/team',
      label: 'Equipo',
      icon: IconUserPlus,
      permission: FeatureCodes.organizationTeam,
      activeMatch: 'prefix',
    },
    {
      kind: 'link',
      id: 'admin-roles',
      to: '/role-permissions',
      label: 'Roles y permisos',
      icon: IconShieldLock,
      permission: FeatureCodes.organizationRoles,
      activeMatch: 'prefix',
    },
    {
      kind: 'link',
      id: 'admin-datos',
      to: '/settings',
      label: 'Datos del conjunto',
      icon: IconSettings,
      permission: FeatureCodes.settingsTenant,
      activeMatch: 'exact',
    },
    {
      kind: 'link',
      id: 'admin-panel',
      to: '/settings/dashboard',
      label: 'Panel de inicio',
      icon: IconLayoutGrid,
      permission: FeatureCodes.dashboardConfigure,
      activeMatch: 'prefix',
    },
    {
      kind: 'link',
      id: 'admin-apariencia',
      to: '/settings/appearance',
      label: 'Apariencia',
      icon: IconPalette,
      permission: FeatureCodes.dashboardView,
      activeMatch: 'prefix',
    },
    {
      kind: 'link',
      id: 'admin-plataforma',
      to: '/platform/status',
      label: 'Estado de la plataforma',
      icon: IconServer,
      platformAdmin: true,
      activeMatch: 'prefix',
    },
  ]
}

function normalizePath(path: string): string {
  if (path.length > 1 && path.endsWith('/')) return path.slice(0, -1)
  return path
}

function pathMatches(pathname: string, item: AppNavLeaf): boolean {
  if (!item.to || item.to.startsWith('__')) return false
  const current = normalizePath(pathname)
  const target = normalizePath(item.to)
  if (item.activeMatch === 'exact') return current === target
  return current === target || current.startsWith(`${target}/`)
}

/** Single active leaf: exact matches win, otherwise longest prefix. */
export function resolveActiveNavId(pathname: string, items: AppNavLeaf[]): string | null {
  const matches = items.filter((item) => pathMatches(pathname, item))
  if (matches.length === 0) return null

  const exact = matches.filter((item) => item.activeMatch === 'exact')
  const pool = exact.length > 0 ? exact : matches
  return [...pool].sort((a, b) => b.to.length - a.to.length)[0]?.id ?? null
}

/** First reachable destination for the user's permissions (post-login / forbidden redirect). */
export function resolveDefaultLandingPath(
  permissions: string[],
  propertyId: string | null | undefined,
  isPlatformAdmin = false,
  modules?: TenantModuleFlags | null,
): string {
  const links = filterVisibleNav(buildAppNav(propertyId), permissions, isPlatformAdmin, modules).filter(
    (item): item is AppNavLeaf => item.kind === 'link' && !(item.requiresProperty && !propertyId),
  )
  const operational = links.filter(
    (item) =>
      item.to !== '/dashboard' &&
      !item.to.startsWith('/settings') &&
      !item.platformAdmin &&
      !item.to.startsWith('/neighborhoods') &&
      !item.to.startsWith('/vehicle-brands') &&
      !item.to.startsWith('/employees') &&
      !item.to.startsWith('/team') &&
      !item.to.startsWith('/role-permissions') &&
      !item.to.startsWith('/people') &&
      !item.to.startsWith('/platform') &&
      !item.to.startsWith('/accounting') &&
      !item.to.startsWith('/assemblies'),
  )
  if (operational.length === 1) return operational[0]!.to

  const dashboard = links.find((item) => item.to === '/dashboard')
  if (dashboard) return dashboard.to

  return operational[0]?.to ?? links[0]?.to ?? '/dashboard'
}

export function filterVisibleNav(
  items: AppNavItem[],
  permissions: string[],
  isPlatformAdmin: boolean,
  modules?: TenantModuleFlags | null,
): AppNavItem[] {
  const canSee = (item: AppNavLeaf) => {
    if (item.platformAdmin) return isPlatformAdmin
    if (item.tenantModule && !isTenantModuleEnabled(modules, item.tenantModule)) return false
    if (item.permissionsAnyOf?.length)
      return item.permissionsAnyOf.some((code) => permissions.includes(code))
    if (!item.permission) return true
    return permissions.includes(item.permission)
  }

  return items.filter((item, index, all) => {
    if (item.kind === 'section') {
      for (let i = index + 1; i < all.length; i++) {
        const next = all[i]
        if (next.kind === 'section') break
        if (canSee(next)) return true
      }
      return false
    }
    return canSee(item)
  })
}
