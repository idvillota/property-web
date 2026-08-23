import { Anchor, Group, Stack, Text, ThemeIcon } from '@mantine/core'
import {
  IconCash,
  IconChartBar,
  IconIdBadge,
  IconLayoutGrid,
  IconMessageCircle,
  IconNews,
  IconPackage,
  IconReceipt,
  IconSettings,
  IconShieldLock,
  IconSitemap,
  IconUserPlus,
  IconUsersGroup,
} from '@tabler/icons-react'
import type { TablerIcon } from '@tabler/icons-react'
import { Link } from 'react-router-dom'
import { propertyPath } from '../../../app/navConfig'
import { FeatureCodes } from '../../../lib/permissions'
import { useCurrentProperty } from '../../../hooks/useCurrentProperty'
import { useAuthStore } from '../../../stores/authStore'

type QuickLink = {
  to: string
  label: string
  description: string
  permission: string
  icon: TablerIcon
}

export function QuickLinksWidget() {
  const permissions = useAuthStore((s) => s.permissions)
  const propertyId = useCurrentProperty().data?.id ?? null
  const p = (suffix = '') => propertyPath(propertyId, suffix)

  const links: QuickLink[] = [
    {
      to: p('reception'),
      label: 'Portería',
      description: 'Entregas entrantes y salientes',
      permission: FeatureCodes.receptionManage,
      icon: IconPackage,
    },
    {
      to: p('payments'),
      label: 'Pagos',
      description: 'Registrar pagos de cuotas',
      permission: FeatureCodes.billingPayments,
      icon: IconCash,
    },
    {
      to: p('charges'),
      label: 'Cargos',
      description: 'Cartera y cuotas del periodo',
      permission: FeatureCodes.billingCharges,
      icon: IconReceipt,
    },
    {
      to: p('pqrs'),
      label: 'PQRS',
      description: 'Bandeja de peticiones y quejas',
      permission: FeatureCodes.pqrsManage,
      icon: IconMessageCircle,
    },
    {
      to: p('mural'),
      label: 'Mural',
      description: 'Avisos oficiales y de la comunidad',
      permission: FeatureCodes.muralManage,
      icon: IconNews,
    },
    {
      to: p('estructura'),
      label: 'Estructura',
      description: 'Edificios, pisos y unidades',
      permission: FeatureCodes.structureBuildings,
      icon: IconSitemap,
    },
    {
      to: p('occupancies'),
      label: 'Personas y ocupaciones',
      description: 'Habitantes y responsables',
      permission: FeatureCodes.peopleManage,
      icon: IconUsersGroup,
    },
    {
      to: p('reports'),
      label: 'Reportes',
      description: 'Cartera, ocupación y más',
      permission: FeatureCodes.reportsView,
      icon: IconChartBar,
    },
    {
      to: '/team',
      label: 'Equipo',
      description: 'Invita usuarios a este tenant',
      permission: FeatureCodes.organizationTeam,
      icon: IconUserPlus,
    },
    {
      to: '/role-permissions',
      label: 'Roles',
      description: 'Administra permisos por rol',
      permission: FeatureCodes.organizationRoles,
      icon: IconShieldLock,
    },
    {
      to: '/employees',
      label: 'Empleados',
      description: 'Mantén los registros de personal',
      permission: FeatureCodes.organizationEmployees,
      icon: IconIdBadge,
    },
    {
      to: '/settings/dashboard',
      label: 'Panel de inicio',
      description: 'Organiza los widgets del inicio',
      permission: FeatureCodes.dashboardConfigure,
      icon: IconLayoutGrid,
    },
    {
      to: '/settings',
      label: 'Datos del conjunto',
      description: 'Datos legales y del conjunto residencial',
      permission: FeatureCodes.settingsTenant,
      icon: IconSettings,
    },
  ]

  const visible = links.filter((link) => permissions.includes(link.permission))

  if (visible.length === 0) {
    return (
      <Text size="sm" c="dimmed">
        No hay accesos rápidos para tu rol.
      </Text>
    )
  }

  return (
    <Group gap="md" align="stretch" wrap="wrap">
      {visible.map((link) => (
        <Anchor
          key={link.to}
          component={Link}
          to={link.to}
          underline="never"
          c="inherit"
          style={{ flex: '1 1 160px', maxWidth: 240 }}
        >
          <Stack gap={4}>
            <Group gap="xs" wrap="nowrap">
              <ThemeIcon variant="light" size="md" radius="md">
                <link.icon size={16} stroke={1.75} />
              </ThemeIcon>
              <Text size="sm" fw={600}>
                {link.label}
              </Text>
            </Group>
            <Text size="xs" c="dimmed">
              {link.description}
            </Text>
          </Stack>
        </Anchor>
      ))}
    </Group>
  )
}
