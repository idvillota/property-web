import type { DashboardPanel } from '../../../api/types'
import { QuickLinksWidget } from '../widgets/QuickLinksWidget'

type DashboardWidgetRendererProps = {
  panel: DashboardPanel
}

export function DashboardWidgetRenderer({ panel }: DashboardWidgetRendererProps) {
  switch (panel.widgetType) {
    case 'quick_links':
      return <QuickLinksWidget />
    default:
      return null
  }
}
