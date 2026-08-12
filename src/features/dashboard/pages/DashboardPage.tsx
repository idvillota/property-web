import { Button, Stack, Text } from '@mantine/core'
import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { api } from '../../../api/client'
import type { DashboardLayout, DashboardPanel } from '../../../api/types'
import { PageHeader } from '../../../components/shared/PageHeader'
import { FeatureCodes } from '../../../lib/permissions'
import { useAuthStore } from '../../../stores/authStore'
import { DashboardGrid } from '../components/DashboardGrid'
import { getWidgetMeta } from '../dashboardCatalog'

function filterPanelsForUser(panels: DashboardPanel[], hasPermission: (code: string) => boolean) {
  return panels.filter((panel) => {
    const meta = getWidgetMeta(panel.widgetType)
    if (!meta) return false
    return hasPermission(meta.requiredPermission)
  })
}

export function DashboardPage() {
  const hasPermission = useAuthStore((s) => s.hasPermission)
  const canConfigure = hasPermission(FeatureCodes.dashboardConfigure)

  const layoutQuery = useQuery({
    queryKey: ['dashboard', 'layout'],
    queryFn: async () => {
      const { data } = await api.get<DashboardLayout>('/api/dashboard/layout')
      return data
    },
  })

  const visiblePanels = filterPanelsForUser(layoutQuery.data?.panels ?? [], hasPermission)

  return (
    <Stack gap="lg">
      <PageHeader
        title="Inicio"
        description="Resumen configurado para tu tenant."
        actions={
          canConfigure ? (
            <Button component={Link} to="/settings/dashboard" variant="light">
              Panel de inicio
            </Button>
          ) : undefined
        }
      />

      {layoutQuery.isLoading ? (
        <Text c="dimmed">Cargando inicio…</Text>
      ) : visiblePanels.length === 0 ? (
        <Text c="dimmed">
          No hay widgets visibles para tu rol.
          {canConfigure ? ' Usa Panel de inicio para armar el tablero.' : null}
        </Text>
      ) : (
        <DashboardGrid panels={visiblePanels} />
      )}
    </Stack>
  )
}
