import { Anchor, Group, Stack, Text, ThemeIcon } from '@mantine/core'
import {
  IconBuildingCommunity,
  IconIdBadge,
  IconLayoutGrid,
  IconSettings,
  IconShieldLock,
  IconUserPlus,
  IconUsers,
} from '@tabler/icons-react'
import type { TablerIcon } from '@tabler/icons-react'
import { Link } from 'react-router-dom'
import { FeatureCodes } from '../../../lib/permissions'
import { useAuthStore } from '../../../stores/authStore'

type QuickLink = {
  to: string
  label: string
  description: string
  permission: string
  icon: TablerIcon
}

const LINKS: QuickLink[] = [
  {
    to: '/properties',
    label: 'Mi propiedad',
    description: 'Espacio de trabajo de la copropiedad',
    permission: FeatureCodes.structureProperties,
    icon: IconBuildingCommunity,
  },
  {
    to: '/people',
    label: 'Personas',
    description: 'Propietarios, arrendatarios y contactos',
    permission: FeatureCodes.peopleManage,
    icon: IconUsers,
  },
  {
    to: '/settings/dashboard',
    label: 'Configurar inicio',
    description: 'Organiza los widgets del inicio',
    permission: FeatureCodes.dashboardConfigure,
    icon: IconLayoutGrid,
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
    to: '/settings',
    label: 'Configuración',
    description: 'Datos legales y de la propiedad',
    permission: FeatureCodes.settingsTenant,
    icon: IconSettings,
  },
]

export function QuickLinksWidget() {
  const permissions = useAuthStore((s) => s.permissions)
  const visible = LINKS.filter((link) => permissions.includes(link.permission))

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
