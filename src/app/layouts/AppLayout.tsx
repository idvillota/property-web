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
import { IconLogout } from '@tabler/icons-react'
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { useEffect, useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { api } from '../../api/client'
import type { TenantModuleFlags } from '../../api/types'
import { AppLogo } from '../../components/shared/AppLogo'
import { clearAuthSession } from '../../features/auth/applyAuthSession'
import { DEFAULT_TENANT_MODULES } from '../../features/settings/lib/tenantModuleFlags'
import { useCurrentProperty } from '../../hooks/useCurrentProperty'
import { ROLE_LABELS } from '../../lib/permissions'
import { useAuthStore } from '../../stores/authStore'
import {
  buildAppNav,
  filterVisibleNav,
  resolveActiveNavId,
  type AppNavLeaf,
} from '../navConfig'
import { appLayoutMobileNavSmoke } from './lib/appLayoutMobileNavSmoke'

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
  const modules = useAuthStore((s) => s.modules)
  const setModules = useAuthStore((s) => s.setModules)
  const currentProperty = useCurrentProperty()
  const propertyId = currentProperty.data?.id ?? null
  const propertyReady = !currentProperty.isLoading && Boolean(propertyId)

  const modulesQuery = useQuery({
    queryKey: ['tenantModules'],
    queryFn: async () => {
      const { data } = await api.get<TenantModuleFlags>('/api/tenant/modules')
      return data
    },
  })

  useEffect(() => {
    if (modulesQuery.data) setModules(modulesQuery.data)
  }, [modulesQuery.data, setModules])

  const userSubtitle = useMemo(() => {
    const roleLabels = roles.map((role) => ROLE_LABELS[role] ?? role)
    if (roleLabels.length === 0) return email
    return `${email} - ${roleLabels.join(', ')}`
  }, [email, roles])

  const effectiveModules = modulesQuery.data ?? modules ?? DEFAULT_TENANT_MODULES

  const visibleNav = useMemo(
    () => filterVisibleNav(buildAppNav(propertyId), permissions, isPlatformAdmin, effectiveModules),
    [propertyId, permissions, isPlatformAdmin, effectiveModules],
  )

  const activeNavId = useMemo(() => {
    const links = visibleNav.filter((item): item is AppNavLeaf => item.kind === 'link')
    return resolveActiveNavId(location.pathname, links)
  }, [visibleNav, location.pathname])

  void appLayoutMobileNavSmoke({
    isMobile: Boolean(isMobileNav),
    burgerOpensNav: true,
    hasQuickLinks: visibleNav.some((n) => n.kind === 'link'),
  })

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
          {visibleNav.map((item, i) => {
            if (item.kind === 'section') {
              return (
                <Divider key={`s-${item.area}-${i}`} label={item.label} labelPosition="left" my="sm" />
              )
            }

            const disabled = Boolean(item.requiresProperty && !propertyReady)
            const icon = (
              <ThemeIcon variant="light" size="md" radius="md">
                <item.icon size={16} stroke={1.75} />
              </ThemeIcon>
            )

            if (disabled) {
              return <NavLink key={item.id} label={item.label} disabled leftSection={icon} />
            }

            return (
              <NavLink
                key={item.id}
                component={Link}
                to={item.to}
                label={item.label}
                leftSection={icon}
                active={activeNavId === item.id}
                onClick={close}
              />
            )
          })}
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
