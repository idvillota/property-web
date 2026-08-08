import { ActionIcon, Box, Group, Stack, Text } from '@mantine/core'
import type { MouseEvent } from 'react'
import { IconGripVertical, IconTrash } from '@tabler/icons-react'
import type { DashboardPanel } from '../../../api/types'
import { getWidgetMeta } from '../dashboardCatalog'
import { DashboardWidgetRenderer } from './DashboardWidgetRenderer'

type DashboardPanelChromeProps = {
  panel: DashboardPanel
  editable?: boolean
  onRemovePanel?: (panelId: string) => void
  onPanelConfigChange?: (panelId: string, config: Record<string, unknown>) => void
  onMoveStart?: (event: MouseEvent) => void
}

export function DashboardPanelChrome({
  panel,
  editable = false,
  onRemovePanel,
  onMoveStart,
}: DashboardPanelChromeProps) {
  const meta = getWidgetMeta(panel.widgetType)

  return (
    <Stack gap="sm" h="100%">
      {(editable || meta) && (
        <Group
          justify="space-between"
          wrap="nowrap"
          gap="xs"
          className={editable ? 'dashboard-panel-drag-handle' : undefined}
          onMouseDown={editable && onMoveStart ? onMoveStart : undefined}
        >
          <Group gap="xs" wrap="nowrap" style={{ minWidth: 0, flex: 1 }}>
            {editable ? (
              <Box component="span" c="dimmed" style={{ display: 'flex', flexShrink: 0 }}>
                <IconGripVertical size={16} />
              </Box>
            ) : null}
            <Text size="sm" fw={600} truncate>
              {meta?.name ?? panel.widgetType}
            </Text>
          </Group>
          {editable && onRemovePanel ? (
            <ActionIcon
              variant="subtle"
              color="red"
              size="sm"
              aria-label="Remove panel"
              onMouseDown={(event) => event.stopPropagation()}
              onClick={() => onRemovePanel(panel.id)}
            >
              <IconTrash size={16} />
            </ActionIcon>
          ) : null}
        </Group>
      )}

      <Box className="dashboard-panel-body" style={{ flex: 1, minHeight: 0, overflow: 'hidden' }}>
        <DashboardWidgetRenderer panel={panel} />
      </Box>
    </Stack>
  )
}
