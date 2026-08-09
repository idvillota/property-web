import {
  Button,
  Card,
  Group,
  ScrollArea,
  Stack,
  Text,
  Title,
} from '@mantine/core'
import { notifications } from '@mantine/notifications'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useEffect, useMemo, useState } from 'react'
import { Link, Navigate } from 'react-router-dom'
import { api } from '../../../api/client'
import { getApiErrorMessage } from '../../../api/errors'
import type { DashboardLayout, DashboardPanel, DashboardWidgetDefinition } from '../../../api/types'
import { PageHeader } from '../../../components/shared/PageHeader'
import { FeatureCodes } from '../../../lib/permissions'
import { useAuthStore } from '../../../stores/authStore'
import { DashboardGridEditor } from '../components/DashboardGridEditor'
import {
  createPanelId,
  DASHBOARD_WIDGET_CATALOG,
  getWidgetMeta,
} from '../dashboardCatalog'

function nextPanelPosition(panels: DashboardPanel[]) {
  if (panels.length === 0) return { x: 0, y: 0 }
  const bottom = panels.reduce((max, p) => Math.max(max, p.y + p.h), 0)
  return { x: 0, y: bottom }
}

export function DashboardSettingsPage() {
  const canConfigure = useAuthStore((s) => s.hasPermission(FeatureCodes.dashboardConfigure))
  const queryClient = useQueryClient()
  const [panels, setPanels] = useState<DashboardPanel[]>([])

  const layoutQuery = useQuery({
    queryKey: ['dashboard', 'layout'],
    queryFn: async () => {
      const { data } = await api.get<DashboardLayout>('/api/dashboard/layout')
      return data
    },
    enabled: canConfigure,
  })

  useEffect(() => {
    if (layoutQuery.data) {
      setPanels(layoutQuery.data.panels)
    }
  }, [layoutQuery.data])

  const catalogQuery = useQuery({
    queryKey: ['dashboard', 'catalog'],
    queryFn: async () => {
      const { data } = await api.get<DashboardWidgetDefinition[]>('/api/dashboard/catalog')
      return data
    },
    enabled: canConfigure,
  })

  const catalog = useMemo(() => {
    const fromApi = catalogQuery.data ?? []
    return fromApi.length > 0 ? fromApi : DASHBOARD_WIDGET_CATALOG
  }, [catalogQuery.data])

  const saveMutation = useMutation({
    mutationFn: async () => {
      const payload: DashboardLayout = { version: 1, panels }
      const { data } = await api.put<DashboardLayout>('/api/dashboard/layout', payload)
      return data
    },
    onSuccess: (data) => {
      setPanels(data.panels)
      queryClient.setQueryData(['dashboard', 'layout'], data)
      notifications.show({ color: 'green', message: 'Inicio guardado.' })
    },
    onError: (error) => {
      notifications.show({ color: 'red', message: getApiErrorMessage(error) })
    },
  })

  const addWidget = (widgetType: string) => {
    const meta = getWidgetMeta(widgetType)
    if (!meta) return

    const pos = nextPanelPosition(panels)

    setPanels((current) => [
      ...current,
      {
        id: createPanelId(),
        widgetType,
        x: pos.x,
        y: pos.y,
        w: meta.defaultWidth,
        h: meta.defaultHeight,
      },
    ])
  }

  const removePanel = (panelId: string) => {
    setPanels((current) => current.filter((p) => p.id !== panelId))
  }

  const updatePanelConfig = (panelId: string, config: Record<string, unknown>) => {
    setPanels((current) =>
      current.map((p) => (p.id === panelId ? { ...p, config } : p)),
    )
  }

  if (!canConfigure) return <Navigate to="/dashboard" replace />

  return (
    <Stack gap="lg">
      <PageHeader
        title="Configurar inicio"
        description="Arrastra y redimensiona widgets. Solo los administradores pueden editar el inicio."
        actions={
          <Group>
            <Button component={Link} to="/dashboard" variant="default">
              Ver inicio
            </Button>
            <Button
              onClick={() => saveMutation.mutate()}
              loading={saveMutation.isPending}
              disabled={layoutQuery.isLoading}
            >
              Guardar
            </Button>
          </Group>
        }
      />

      <Group align="flex-start" gap="lg" wrap="nowrap" className="dashboard-settings-layout">
        <Card withBorder padding="md" radius="md" w={280} className="dashboard-settings-sidebar">
          <Title order={5} mb="sm">
            Agregar widget
          </Title>
          <Text size="sm" c="dimmed" mb="md">
            Haz clic para agregar un widget y luego arrástralo a su lugar.
          </Text>
          <ScrollArea h={420} type="auto" offsetScrollbars>
            <Stack gap="xs">
              {catalog.map((widget) => (
                <Button
                  key={widget.widgetType}
                  variant="light"
                  size="compact-sm"
                  justify="flex-start"
                  onClick={() => addWidget(widget.widgetType)}
                >
                  <Stack gap={0} align="flex-start">
                    <Text size="sm" fw={600}>
                      {widget.name}
                    </Text>
                    <Text size="xs" c="dimmed">
                      {widget.category}
                    </Text>
                  </Stack>
                </Button>
              ))}
            </Stack>
          </ScrollArea>
        </Card>

        <Stack style={{ flex: 1, minWidth: 0 }} gap="md">
          {panels.length === 0 ? (
            <Card withBorder padding="xl" radius="md">
              <Text c="dimmed" ta="center">
                El inicio está vacío. Agrega widgets desde la lista lateral.
              </Text>
            </Card>
          ) : (
            <DashboardGridEditor
              panels={panels}
              onPanelsChange={setPanels}
              onRemovePanel={removePanel}
              onPanelConfigChange={updatePanelConfig}
            />
          )}
        </Stack>
      </Group>
    </Stack>
  )
}
