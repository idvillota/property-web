import { FeatureCodes } from '../../lib/permissions'

export type DashboardWidgetMeta = {
  widgetType: string
  name: string
  description: string
  category: string
  requiredPermission: string
  defaultWidth: number
  defaultHeight: number
  minWidth: number
  minHeight: number
}

/** Client-side catalog mirror; server validates on save. */
export const DASHBOARD_WIDGET_CATALOG: DashboardWidgetMeta[] = [
  {
    widgetType: 'quick_links',
    name: 'Quick links',
    description: 'Shortcuts to common Property administration areas.',
    category: 'General',
    requiredPermission: FeatureCodes.dashboardView,
    defaultWidth: 12,
    defaultHeight: 3,
    minWidth: 4,
    minHeight: 2,
  },
]

export const DASHBOARD_WIDGET_BY_TYPE = Object.fromEntries(
  DASHBOARD_WIDGET_CATALOG.map((w) => [w.widgetType, w]),
) as Record<string, DashboardWidgetMeta>

export const DASHBOARD_GRID_COLS = 12
export const DASHBOARD_ROW_HEIGHT = 72

export function getWidgetMeta(widgetType: string): DashboardWidgetMeta | undefined {
  return DASHBOARD_WIDGET_BY_TYPE[widgetType]
}

export function getPanelIntConfig(
  config: Record<string, unknown> | undefined,
  key: string,
  fallback: number,
): number {
  const value = config?.[key]
  if (typeof value === 'number' && Number.isFinite(value)) return value
  if (typeof value === 'string') {
    const parsed = Number(value)
    if (Number.isFinite(parsed)) return parsed
  }
  return fallback
}

export function dateRangeForDays(days: number): { start: string; end: string } {
  const end = new Date()
  const start = new Date()
  start.setDate(start.getDate() - Math.max(1, days) + 1)
  const fmt = (d: Date) => {
    const y = d.getFullYear()
    const m = String(d.getMonth() + 1).padStart(2, '0')
    const day = String(d.getDate()).padStart(2, '0')
    return `${y}-${m}-${day}`
  }
  return { start: fmt(start), end: fmt(end) }
}

export function createPanelId(): string {
  return `panel-${crypto.randomUUID().slice(0, 8)}`
}

export function sortPanels<T extends { y: number; x: number }>(panels: T[]): T[] {
  return [...panels].sort((a, b) => a.y - b.y || a.x - b.x)
}
