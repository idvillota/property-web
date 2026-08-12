import { Group, NavLink, Stack, Text } from '@mantine/core'
import {
  IconCalendarCheck,
  IconCalendarEvent,
  IconCar,
  IconCash,
  IconChartBar,
  IconCreditCard,
  IconHome,
  IconPackage,
  IconPool,
  IconReceipt,
  IconSitemap,
  IconUsersGroup,
} from '@tabler/icons-react'
import type { TablerIcon } from '@tabler/icons-react'
import { useMemo } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { FeatureCodes } from '../../../lib/permissions'
import { useAuthStore } from '../../../stores/authStore'

type Props = {
  propertyId: string
}

type NavItem = {
  to: string
  label: string
  permission: string
  icon: TablerIcon
}

type NavSection = {
  label: string
  items: NavItem[]
}

const SECTIONS: NavSection[] = [
  {
    label: 'Copropiedad',
    items: [
      { to: '', label: 'Resumen', permission: FeatureCodes.structureProperties, icon: IconHome },
      {
        to: 'estructura',
        label: 'Edificios y unidades',
        permission: FeatureCodes.structureBuildings,
        icon: IconSitemap,
      },
      {
        to: 'occupancies',
        label: 'Personas y ocupaciones',
        permission: FeatureCodes.peopleManage,
        icon: IconUsersGroup,
      },
      {
        to: 'vehicles',
        label: 'Vehículos',
        permission: FeatureCodes.structureUnits,
        icon: IconCar,
      },
    ],
  },
  {
    label: 'Cartera',
    items: [
      { to: 'billing', label: 'Cuotas', permission: FeatureCodes.billingSettings, icon: IconCash },
      { to: 'periods', label: 'Periodos', permission: FeatureCodes.billingCharges, icon: IconCalendarEvent },
      { to: 'charges', label: 'Cargos', permission: FeatureCodes.billingCharges, icon: IconReceipt },
      { to: 'payments', label: 'Pagos', permission: FeatureCodes.billingPayments, icon: IconCreditCard },
    ],
  },
  {
    label: 'Comunidad',
    items: [
      { to: 'common-areas', label: 'Zonas', permission: FeatureCodes.amenitiesAreas, icon: IconPool },
      {
        to: 'reservations',
        label: 'Reservas',
        permission: FeatureCodes.amenitiesReservations,
        icon: IconCalendarCheck,
      },
      { to: 'reception', label: 'Portería', permission: FeatureCodes.receptionManage, icon: IconPackage },
    ],
  },
  {
    label: 'Análisis',
    items: [{ to: 'reports', label: 'Reportes', permission: FeatureCodes.reportsView, icon: IconChartBar }],
  },
]

export function PropertySubnav({ propertyId }: Props) {
  const location = useLocation()
  const permissions = useAuthStore((s) => s.permissions)
  const base = `/properties/${propertyId}`

  const visibleSections = useMemo(
    () =>
      SECTIONS.map((section) => ({
        ...section,
        items: section.items.filter((item) => permissions.includes(item.permission)),
      })).filter((section) => section.items.length > 0),
    [permissions],
  )

  return (
    <Group gap="md" align="flex-start" wrap="wrap">
      {visibleSections.map((section) => (
        <Stack key={section.label} gap={2}>
          <Text size="xs" c="dimmed" tt="uppercase" fw={600} px={8}>
            {section.label}
          </Text>
          <Group gap={4} wrap="wrap">
            {section.items.map((tab) => {
              const to = tab.to ? `${base}/${tab.to}` : base
              const active =
                tab.to === ''
                  ? location.pathname === base || location.pathname === `${base}/`
                  : location.pathname === to || location.pathname.startsWith(`${to}/`)
              const Icon = tab.icon

              return (
                <NavLink
                  key={`${section.label}-${tab.label}`}
                  component={Link}
                  to={to}
                  label={tab.label}
                  leftSection={<Icon size={16} stroke={1.75} />}
                  active={active}
                  variant="subtle"
                  style={{ borderRadius: 8, flex: '0 0 auto' }}
                />
              )
            })}
          </Group>
        </Stack>
      ))}
    </Group>
  )
}
