import { Card } from '@mantine/core'
import { useMediaQuery } from '@mantine/hooks'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { DashboardPanel } from '../../../api/types'
import { sortPanels } from '../dashboardCatalog'
import { DashboardPanelChrome } from './DashboardPanelChrome'
import {
  gridHeight,
  mergePanelGeometry,
  panelToRect,
  pointerToGrid,
} from './dashboardGridLayout'

type DashboardGridEditorProps = {
  panels: DashboardPanel[]
  onPanelsChange: (panels: DashboardPanel[]) => void
  onRemovePanel: (panelId: string) => void
  onPanelConfigChange: (panelId: string, config: Record<string, unknown>) => void
}

type DragState =
  | {
      kind: 'move'
      panelId: string
      offsetX: number
      offsetY: number
    }
  | {
      kind: 'resize'
      panelId: string
      edge: 'se' | 's' | 'e'
      originX: number
      originY: number
      startW: number
      startH: number
    }

export function DashboardGridEditor({
  panels,
  onPanelsChange,
  onRemovePanel,
  onPanelConfigChange,
}: DashboardGridEditorProps) {
  const isMobile = useMediaQuery('(max-width: 47.99em)')
  const containerRef = useRef<HTMLDivElement>(null)
  const panelsRef = useRef(panels)
  const dragRef = useRef<DragState | null>(null)
  const [containerWidth, setContainerWidth] = useState(0)
  const [activePanelId, setActivePanelId] = useState<string | null>(null)

  panelsRef.current = panels

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

  const canvasHeight = useMemo(() => gridHeight(panels), [panels])
  const sortedMobilePanels = useMemo(() => sortPanels(panels), [panels])

  const applyPanelPatch = useCallback(
    (panelId: string, patch: Partial<Pick<DashboardPanel, 'x' | 'y' | 'w' | 'h'>>) => {
      onPanelsChange(mergePanelGeometry(panelsRef.current, panelId, patch))
    },
    [onPanelsChange],
  )

  const endInteraction = useCallback(() => {
    dragRef.current = null
    setActivePanelId(null)
  }, [])

  useEffect(() => {
    const onMouseMove = (event: MouseEvent) => {
      const drag = dragRef.current
      const container = containerRef.current
      if (!drag || !container || containerWidth <= 0) return

      const rect = container.getBoundingClientRect()
      const grid = pointerToGrid(event.clientX, event.clientY, rect, containerWidth)
      const panel = panelsRef.current.find((p) => p.id === drag.panelId)
      if (!panel) return

      if (drag.kind === 'move') {
        applyPanelPatch(drag.panelId, {
          x: grid.x - drag.offsetX,
          y: grid.y - drag.offsetY,
        })
        return
      }

      const patch: Partial<Pick<DashboardPanel, 'x' | 'y' | 'w' | 'h'>> = {}
      if (drag.edge === 'e' || drag.edge === 'se') {
        patch.w = Math.max(2, grid.x - drag.originX + 1)
      }
      if (drag.edge === 's' || drag.edge === 'se') {
        patch.h = Math.max(2, grid.y - drag.originY + 1)
      }
      applyPanelPatch(drag.panelId, patch)
    }

    const onMouseUp = () => endInteraction()

    window.addEventListener('mousemove', onMouseMove)
    window.addEventListener('mouseup', onMouseUp)
    return () => {
      window.removeEventListener('mousemove', onMouseMove)
      window.removeEventListener('mouseup', onMouseUp)
    }
  }, [applyPanelPatch, containerWidth, endInteraction])

  const startMove = (panelId: string, event: React.MouseEvent) => {
    if (event.button !== 0) return
    event.preventDefault()
    event.stopPropagation()

    const container = containerRef.current
    const panel = panelsRef.current.find((p) => p.id === panelId)
    if (!container || !panel || containerWidth <= 0) return

    const rect = container.getBoundingClientRect()
    const grid = pointerToGrid(event.clientX, event.clientY, rect, containerWidth)

    dragRef.current = {
      kind: 'move',
      panelId,
      offsetX: grid.x - panel.x,
      offsetY: grid.y - panel.y,
    }
    setActivePanelId(panelId)
  }

  const startResize = (
    panelId: string,
    edge: 'se' | 's' | 'e',
    event: React.MouseEvent,
  ) => {
    if (event.button !== 0) return
    event.preventDefault()
    event.stopPropagation()

    const panel = panelsRef.current.find((p) => p.id === panelId)
    if (!panel) return

    dragRef.current = {
      kind: 'resize',
      panelId,
      edge,
      originX: panel.x,
      originY: panel.y,
      startW: panel.w,
      startH: panel.h,
    }
    setActivePanelId(panelId)
  }

  if (isMobile) {
    return (
      <div className="dashboard-grid-mobile">
        {sortedMobilePanels.map((panel) => (
          <Card key={panel.id} withBorder padding="md" radius="md">
            <DashboardPanelChrome
              panel={panel}
              editable
              onRemovePanel={onRemovePanel}
              onPanelConfigChange={onPanelConfigChange}
            />
          </Card>
        ))}
      </div>
    )
  }

  return (
    <div
      ref={containerRef}
      className="dashboard-grid-canvas dashboard-grid-canvas--editable"
      style={{ height: canvasHeight }}
    >
      {containerWidth > 0 &&
        panels.map((panel) => {
          const rect = panelToRect(panel, containerWidth)
          const isActive = activePanelId === panel.id

          return (
            <div
              key={panel.id}
              className={`dashboard-grid-panel${isActive ? ' dashboard-grid-panel--active' : ''}`}
              style={{
                left: rect.left,
                top: rect.top,
                width: rect.width,
                height: rect.height,
              }}
            >
              <Card withBorder padding="md" radius="md" h="100%">
                <DashboardPanelChrome
                  panel={panel}
                  editable
                  onRemovePanel={onRemovePanel}
                  onPanelConfigChange={onPanelConfigChange}
                  onMoveStart={(event) => startMove(panel.id, event)}
                />
              </Card>

              <button
                type="button"
                className="dashboard-resize-handle dashboard-resize-handle--e"
                aria-label="Redimensionar ancho"
                onMouseDown={(event) => startResize(panel.id, 'e', event)}
              />
              <button
                type="button"
                className="dashboard-resize-handle dashboard-resize-handle--s"
                aria-label="Redimensionar alto"
                onMouseDown={(event) => startResize(panel.id, 's', event)}
              />
              <button
                type="button"
                className="dashboard-resize-handle dashboard-resize-handle--se"
                aria-label="Redimensionar panel"
                onMouseDown={(event) => startResize(panel.id, 'se', event)}
              />
            </div>
          )
        })}
    </div>
  )
}
