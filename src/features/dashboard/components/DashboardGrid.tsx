import { Card, Stack } from '@mantine/core'
import { useMediaQuery } from '@mantine/hooks'
import { useEffect, useMemo, useRef, useState } from 'react'
import type { DashboardPanel } from '../../../api/types'
import { sortPanels } from '../dashboardCatalog'
import { DashboardPanelChrome } from './DashboardPanelChrome'
import { gridHeight, panelToRect } from './dashboardGridLayout'

type DashboardGridProps = {
  panels: DashboardPanel[]
}

export function DashboardGrid({ panels }: DashboardGridProps) {
  const isMobile = useMediaQuery('(max-width: 47.99em)')
  const containerRef = useRef<HTMLDivElement>(null)
  const [containerWidth, setContainerWidth] = useState(0)
  const sortedMobilePanels = useMemo(() => sortPanels(panels), [panels])
  const canvasHeight = useMemo(() => gridHeight(panels), [panels])

  useEffect(() => {
    const node = containerRef.current
    if (!node) return

    const observer = new ResizeObserver((entries) => {
      const width = entries[0]?.contentRect.width ?? 0
      setContainerWidth(width)
    })
    observer.observe(node)
    setContainerWidth(node.clientWidth)
    return () => observer.disconnect()
  }, [])

  if (isMobile) {
    return (
      <Stack gap="md">
        {sortedMobilePanels.map((panel) => (
          <Card key={panel.id} withBorder padding="md" radius="md">
            <DashboardPanelChrome panel={panel} />
          </Card>
        ))}
      </Stack>
    )
  }

  return (
    <div
      ref={containerRef}
      className="dashboard-grid-canvas"
      style={{ height: canvasHeight }}
    >
      {containerWidth > 0 &&
        panels.map((panel) => {
          const rect = panelToRect(panel, containerWidth)
          return (
            <div
              key={panel.id}
              className="dashboard-grid-panel"
              style={{
                left: rect.left,
                top: rect.top,
                width: rect.width,
                height: rect.height,
              }}
            >
              <Card withBorder padding="md" radius="md" h="100%">
                <DashboardPanelChrome panel={panel} />
              </Card>
            </div>
          )
        })}
    </div>
  )
}
