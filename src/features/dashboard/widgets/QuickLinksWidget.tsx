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
    label: 'Properties',
    description: 'Horizontal properties workspace',
    permission: FeatureCodes.structureProperties,
    icon: IconBuildingCommunity,
  },
  {
    to: '/people',
    label: 'People',
    description: 'Owners, tenants, and contacts',
    permission: FeatureCodes.peopleManage,
    icon: IconUsers,
  },
  {
    to: '/settings/dashboard',
    label: 'Dashboard settings',
    description: 'Arrange dashboard widgets',
    permission: FeatureCodes.dashboardConfigure,
    icon: IconLayoutGrid,
  },
  {
    to: '/team',
    label: 'Team',
    description: 'Invite users to this tenant',
    permission: FeatureCodes.organizationTeam,
    icon: IconUserPlus,
  },
  {
    to: '/role-permissions',
    label: 'Roles',
    description: 'Manage role permissions',
    permission: FeatureCodes.organizationRoles,
    icon: IconShieldLock,
  },
  {
    to: '/employees',
    label: 'Employees',
    description: 'Maintain employee records',
    permission: FeatureCodes.organizationEmployees,
    icon: IconIdBadge,
  },
  {
    to: '/settings',
    label: 'Tenant settings',
    description: 'Legal and contact details',
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
        No shortcuts available for your role.
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
