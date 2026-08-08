import type { DashboardPanel } from '../../../api/types'
import { getWidgetMeta } from '../dashboardCatalog'

export const DASHBOARD_GRID_COLS = 12
export const DASHBOARD_ROW_HEIGHT = 72
export const DASHBOARD_GRID_MARGIN: [number, number] = [16, 16]
export const DASHBOARD_CONTAINER_PADDING: [number, number] = [0, 0]

export type PanelRect = {
  left: number
  top: number
  width: number
  height: number
}

export function calcColWidth(containerWidth: number): number {
  const [mx, paddingX] = [DASHBOARD_GRID_MARGIN[0], DASHBOARD_CONTAINER_PADDING[0]]
  return (containerWidth - mx * (DASHBOARD_GRID_COLS - 1) - paddingX * 2) / DASHBOARD_GRID_COLS
}

export function panelToRect(panel: DashboardPanel, containerWidth: number): PanelRect {
  const [mx, my] = DASHBOARD_GRID_MARGIN
  const [px, py] = DASHBOARD_CONTAINER_PADDING
  const colWidth = calcColWidth(containerWidth)

  return {
    left: colWidth * panel.x + panel.x * mx + px,
    top: DASHBOARD_ROW_HEIGHT * panel.y + panel.y * my + py,
    width: colWidth * panel.w + Math.max(0, panel.w - 1) * mx,
    height: DASHBOARD_ROW_HEIGHT * panel.h + Math.max(0, panel.h - 1) * my,
  }
}

export function gridHeight(panels: DashboardPanel[]): number {
  if (panels.length === 0) return DASHBOARD_ROW_HEIGHT
  const bottom = panels.reduce((max, p) => Math.max(max, p.y + p.h), 0)
  const [, my] = DASHBOARD_GRID_MARGIN
  const [, py] = DASHBOARD_CONTAINER_PADDING
  return bottom * DASHBOARD_ROW_HEIGHT + Math.max(0, bottom - 1) * my + py * 2
}

export function clampPanel(panel: DashboardPanel): DashboardPanel {
  const meta = getWidgetMeta(panel.widgetType)
  const minW = meta?.minWidth ?? 2
  const minH = meta?.minHeight ?? 2
  const w = Math.min(DASHBOARD_GRID_COLS, Math.max(minW, panel.w))
  const h = Math.max(minH, panel.h)
  const x = Math.min(DASHBOARD_GRID_COLS - w, Math.max(0, panel.x))
  const y = Math.max(0, panel.y)
  return { ...panel, x, y, w, h }
}

export function mergePanelGeometry(
  panels: DashboardPanel[],
  panelId: string,
  patch: Partial<Pick<DashboardPanel, 'x' | 'y' | 'w' | 'h'>>,
): DashboardPanel[] {
  return panels.map((panel) =>
    panel.id === panelId ? clampPanel({ ...panel, ...patch }) : panel,
  )
}

export function pointerToGrid(
  clientX: number,
  clientY: number,
  containerRect: DOMRect,
  containerWidth: number,
): { x: number; y: number } {
  const [mx, my] = DASHBOARD_GRID_MARGIN
  const [px, py] = DASHBOARD_CONTAINER_PADDING
  const colWidth = calcColWidth(containerWidth)

  const localX = clientX - containerRect.left - px
  const localY = clientY - containerRect.top - py

  const x = Math.round(localX / (colWidth + mx))
  const y = Math.round(localY / (DASHBOARD_ROW_HEIGHT + my))

  return {
    x: Math.min(DASHBOARD_GRID_COLS - 1, Math.max(0, x)),
    y: Math.max(0, y),
  }
}

export function sortPanels(panels: DashboardPanel[]) {
  return [...panels].sort((a, b) => a.y - b.y || a.x - b.x)
}
