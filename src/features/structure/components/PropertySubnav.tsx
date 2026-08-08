import { Group, NavLink } from '@mantine/core'
import { useMemo } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { FeatureCodes } from '../../../lib/permissions'
import { useAuthStore } from '../../../stores/authStore'

type Props = {
  propertyId: string
}

const TABS: Array<{ to: string; label: string; permission: string }> = [
  { to: '', label: 'Overview', permission: FeatureCodes.structureProperties },
  { to: 'buildings', label: 'Buildings', permission: FeatureCodes.structureBuildings },
  { to: 'floors', label: 'Floors', permission: FeatureCodes.structureFloors },
  { to: 'units', label: 'Units', permission: FeatureCodes.structureUnits },
  { to: 'occupancies', label: 'Occupancies', permission: FeatureCodes.peopleManage },
  { to: 'billing', label: 'Billing', permission: FeatureCodes.billingSettings },
  { to: 'periods', label: 'Periods', permission: FeatureCodes.billingCharges },
  { to: 'charges', label: 'Charges', permission: FeatureCodes.billingCharges },
  { to: 'payments', label: 'Payments', permission: FeatureCodes.billingPayments },
  { to: 'common-areas', label: 'Common areas', permission: FeatureCodes.amenitiesAreas },
  { to: 'reservations', label: 'Reservations', permission: FeatureCodes.amenitiesReservations },
  { to: 'reception', label: 'Reception', permission: FeatureCodes.receptionManage },
]

export function PropertySubnav({ propertyId }: Props) {
  const location = useLocation()
  const permissions = useAuthStore((s) => s.permissions)
  const base = `/properties/${propertyId}`

  const visibleTabs = useMemo(
    () => TABS.filter((tab) => permissions.includes(tab.permission)),
    [permissions],
  )

  return (
    <Group gap={4} wrap="wrap">
      {visibleTabs.map((tab) => {
        const to = tab.to ? `${base}/${tab.to}` : base
        const active =
          tab.to === ''
            ? location.pathname === base || location.pathname === `${base}/`
            : location.pathname === to || location.pathname.startsWith(`${to}/`)

        return (
          <NavLink
            key={tab.label}
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
  )
}
