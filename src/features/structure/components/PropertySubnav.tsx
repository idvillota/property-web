import { Group, NavLink, Stack, Text } from '@mantine/core'
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
}

type NavSection = {
  label: string
  items: NavItem[]
}

const SECTIONS: NavSection[] = [
  {
    label: 'Structure',
    items: [
      { to: '', label: 'Overview', permission: FeatureCodes.structureProperties },
      { to: 'buildings', label: 'Buildings', permission: FeatureCodes.structureBuildings },
      { to: 'floors', label: 'Floors', permission: FeatureCodes.structureFloors },
      { to: 'units', label: 'Units', permission: FeatureCodes.structureUnits },
      { to: 'occupancies', label: 'Occupancies', permission: FeatureCodes.peopleManage },
    ],
  },
  {
    label: 'Billing',
    items: [
      { to: 'billing', label: 'Billing', permission: FeatureCodes.billingSettings },
      { to: 'periods', label: 'Periods', permission: FeatureCodes.billingCharges },
      { to: 'charges', label: 'Charges', permission: FeatureCodes.billingCharges },
      { to: 'payments', label: 'Payments', permission: FeatureCodes.billingPayments },
    ],
  },
  {
    label: 'Amenities',
    items: [
      { to: 'common-areas', label: 'Common areas', permission: FeatureCodes.amenitiesAreas },
      { to: 'reservations', label: 'Reservations', permission: FeatureCodes.amenitiesReservations },
    ],
  },
  {
    label: 'Reception',
    items: [{ to: 'reception', label: 'Reception', permission: FeatureCodes.receptionManage }],
  },
  {
    label: 'Reports',
    items: [{ to: 'reports', label: 'Reports', permission: FeatureCodes.reportsView }],
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

              return (
                <NavLink
                  key={`${section.label}-${tab.label}`}
                  component={Link}
                  to={to}
                  label={tab.label}
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
