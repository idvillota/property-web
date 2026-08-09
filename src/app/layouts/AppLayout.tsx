import {
  AppShell,
  Box,
  Burger,
  Divider,
  Group,
  NavLink,
  ScrollArea,
  Stack,
  Text,
  ThemeIcon,
  UnstyledButton,
} from '@mantine/core'
import { useDisclosure, useMediaQuery } from '@mantine/hooks'
import {
  IconBuildingCommunity,
  IconIdBadge,
  IconLayoutDashboard,
  IconLayoutGrid,
  IconLogout,
  IconMapPin,
  IconPalette,
  IconServer,
  IconSettings,
  IconShieldLock,
  IconUserPlus,
  IconUsers,
} from '@tabler/icons-react'
import type { TablerIcon } from '@tabler/icons-react'
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { useMemo } from 'react'
import { AppLogo } from '../../components/shared/AppLogo'
import { clearAuthSession } from '../../features/auth/applyAuthSession'
import { FeatureCodes, ROLE_LABELS } from '../../lib/permissions'
import { useAuthStore } from '../../stores/authStore'

type NavItem =
  | { section: string }
  | { to: string; label: string; permission: string; icon: TablerIcon }
  | { to: string; label: string; platformAdmin: true; icon: TablerIcon }

const NAV: NavItem[] = [
  { to: '/dashboard', label: 'Inicio', permission: FeatureCodes.dashboardView, icon: IconLayoutDashboard },

  { section: 'Propiedad' },
  {
    to: '/properties',
    label: 'Mi propiedad',
    permission: FeatureCodes.structureProperties,
    icon: IconBuildingCommunity,
  },
  {
    to: '/neighborhoods',
    label: 'Barrios',
    permission: FeatureCodes.structureNeighborhoods,
    icon: IconMapPin,
  },
  { to: '/people', label: 'Personas', permission: FeatureCodes.peopleManage, icon: IconUsers },

  { section: 'Administración' },
  { to: '/settings', label: 'Configuración', permission: FeatureCodes.settingsTenant, icon: IconSettings },
  {
    to: '/settings/dashboard',
    label: 'Configurar inicio',
    permission: FeatureCodes.dashboardConfigure,
    icon: IconLayoutGrid,
  },
  { to: '/employees', label: 'Empleados', permission: FeatureCodes.organizationEmployees, icon: IconIdBadge },
  { to: '/team', label: 'Invitar equipo', permission: FeatureCodes.organizationTeam, icon: IconUserPlus },
  {
    to: '/role-permissions',
    label: 'Roles y permisos',
    permission: FeatureCodes.organizationRoles,
    icon: IconShieldLock,
  },
  {
    to: '/platform/status',
    label: 'Estado de la plataforma',
    platformAdmin: true,
    icon: IconServer,
  },

  { section: 'Cuenta' },
  { to: '/settings/appearance', label: 'Apariencia', permission: FeatureCodes.dashboardView, icon: IconPalette },
]

export function AppLayout() {
  const [opened, { toggle, close }] = useDisclosure()
  const isMobileNav = useMediaQuery('(max-width: 61.99em)')
  const navigate = useNavigate()
  const location = useLocation()
  const email = useAuthStore((s) => s.email)
  const roles = useAuthStore((s) => s.roles)
  const tenantSlug = useAuthStore((s) => s.tenantSlug)
  const permissions = useAuthStore((s) => s.permissions)
  const isPlatformAdmin = useAuthStore((s) => s.isPlatformAdmin)

  const userSubtitle = useMemo(() => {
    const roleLabels = roles.map((role) => ROLE_LABELS[role] ?? role)
    if (roleLabels.length === 0) return email
    return `${email} - ${roleLabels.join(', ')}`
  }, [email, roles])

  const visibleNav = useMemo(() => {
    const canSee = (item: Exclude<NavItem, { section: string }>) => {
      if ('platformAdmin' in item) return item.platformAdmin && isPlatformAdmin
      return permissions.includes(item.permission)
    }

    return NAV.filter((item) => {
      if ('section' in item) {
        const sectionIndex = NAV.indexOf(item)
        for (let i = sectionIndex + 1; i < NAV.length; i++) {
          const next = NAV[i]
          if ('section' in next) break
          if (canSee(next)) return true
        }
        return false
      }
      return canSee(item)
    })
  }, [permissions, isPlatformAdmin])

  return (
    <AppShell
      mode="static"
      header={{ height: 56 }}
      navbar={{
        width: 280,
        breakpoint: 'md',
        collapsed: { mobile: !opened },
      }}
      padding="md"
    >
      <AppShell.Header className="app-shell-header">
        <Group h="100%" px="md" wrap="nowrap" w="100%" justify="space-between" gap="sm">
          <Group gap="sm" wrap="nowrap" style={{ minWidth: 0, flex: 1 }}>
            <Burger opened={opened} onClick={toggle} hiddenFrom="md" size="sm" aria-label="Abrir menú" />
            <Stack gap={0} style={{ minWidth: 0 }}>
              <Text fw={600} size="sm" lineClamp={1}>
                {tenantSlug}
              </Text>
              <Text size="xs" c="dimmed" lineClamp={1} visibleFrom="md">
                {userSubtitle}
              </Text>
            </Stack>
          </Group>
          <AppLogo variant="header" />
        </Group>
      </AppShell.Header>

      {opened && isMobileNav ? (
        <Box className="app-shell-navbar-backdrop" onClick={close} aria-hidden />
      ) : null}

      <AppShell.Navbar p="md">
        <ScrollArea flex={1} offsetScrollbars>
          {visibleNav.map((item, i) =>
            'section' in item ? (
              <Divider key={`s-${i}`} label={item.section} labelPosition="left" my="sm" />
            ) : (
              <NavLink
                key={item.to}
                component={Link}
                to={item.to}
                label={item.label}
                leftSection={
                  <ThemeIcon variant="light" size="md" radius="md">
                    <item.icon size={16} stroke={1.75} />
                  </ThemeIcon>
                }
                active={
                  location.pathname === item.to ||
                  (item.to !== '/dashboard' && location.pathname.startsWith(`${item.to}/`))
                }
                onClick={close}
              />
            ),
          )}
          <Divider my="sm" />
          <UnstyledButton
            mt="xs"
            py="sm"
            w="100%"
            onClick={() => {
              clearAuthSession()
              navigate('/login')
            }}
            className="app-shell-logout"
          >
            <Group gap="sm">
              <IconLogout size={18} stroke={1.75} />
              <Text size="sm">Cerrar sesión</Text>
            </Group>
          </UnstyledButton>
        </ScrollArea>
      </AppShell.Navbar>

      <AppShell.Main className="app-main">
        <Outlet />
      </AppShell.Main>
    </AppShell>
  )
}
