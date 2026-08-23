import { AppShell, Box, Group, Stack, Text, ThemeIcon, UnstyledButton } from '@mantine/core'
import { IconLogout } from '@tabler/icons-react'
import { Link, Outlet, useNavigate } from 'react-router-dom'
import { clearAuthSession } from '../../auth/applyAuthSession'
import { useAuthStore } from '../../../stores/authStore'
import './portal.css'

export function PortalLayout() {
  const navigate = useNavigate()
  const email = useAuthStore((s) => s.email)
  const tenantSlug = useAuthStore((s) => s.tenantSlug)

  return (
    <AppShell header={{ height: 64 }} padding="md" className="portal-shell">
      <AppShell.Header className="portal-header">
        <Group h="100%" px="md" justify="space-between" wrap="nowrap">
          <UnstyledButton component={Link} to="/portal" className="portal-brand">
            <Stack gap={0}>
              <Text className="portal-brand-name">Portal</Text>
              <Text size="xs" c="dimmed" lineClamp={1}>
                {tenantSlug}
              </Text>
            </Stack>
          </UnstyledButton>
          <Group gap="sm" wrap="nowrap">
            <Text size="sm" c="dimmed" visibleFrom="sm" lineClamp={1}>
              {email}
            </Text>
            <UnstyledButton
              className="portal-logout"
              onClick={() => {
                clearAuthSession()
                navigate('/portal/login', { replace: true })
              }}
              aria-label="Cerrar sesión"
            >
              <ThemeIcon variant="light" color="gray" size="lg" radius="md">
                <IconLogout size={18} />
              </ThemeIcon>
            </UnstyledButton>
          </Group>
        </Group>
      </AppShell.Header>
      <AppShell.Main>
        <Box className="portal-main">
          <Outlet />
        </Box>
      </AppShell.Main>
    </AppShell>
  )
}
