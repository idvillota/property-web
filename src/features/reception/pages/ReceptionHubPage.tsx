import { Tabs } from '@mantine/core'
import { useNavigate, useParams } from 'react-router-dom'
import { ReceptionItemsPage } from './ReceptionItemsPage'
import { VisitorsPage } from './VisitorsPage'
import { porterHubTabsRespectModuleFlags } from '../lib/porterHubTabsRespectModuleFlags'
import { useAuthStore } from '../../../stores/authStore'
import { FeatureCodes } from '../../../lib/permissions'
import { PageHeader } from '../../../components/shared/PageHeader'

/** Spec DIFF-007 — admin portería hub (entregas | visitas | parking). */
export function ReceptionHubPage() {
  const { tab } = useParams()
  const navigate = useNavigate()
  const modules = useAuthStore((s) => s.modules)
  const hasPermission = useAuthStore((s) => s.hasPermission)
  const propertyMatch = window.location.pathname.match(/\/properties\/([^/]+)/)
  const propertyId = propertyMatch?.[1]
  const tabs = porterHubTabsRespectModuleFlags({
    visits: Boolean(modules?.visits),
    parking: hasPermission(FeatureCodes.visitorParking),
  })
  const active = tabs.includes((tab as 'entregas' | 'visitas' | 'parking') ?? 'entregas')
    ? (tab as string)
    : 'entregas'

  return (
    <>
      <PageHeader title="Portería" subtitle="Entregas, visitas y parking en un solo lugar" />
      <Tabs
        value={active}
        onChange={(v) => {
          if (!v || !propertyId) return
          navigate(`/properties/${propertyId}/reception/hub/${v}`)
        }}
      >
        <Tabs.List mb="md">
          {tabs.map((id) => (
            <Tabs.Tab key={id} value={id}>
              {id === 'entregas' ? 'Entregas' : id === 'visitas' ? 'Visitas' : 'Parking'}
            </Tabs.Tab>
          ))}
        </Tabs.List>
        <Tabs.Panel value="entregas">
          <ReceptionItemsPage />
        </Tabs.Panel>
        <Tabs.Panel value="visitas">
          <VisitorsPage />
        </Tabs.Panel>
        {tabs.includes('parking') ? (
          <Tabs.Panel value="parking">
            <PageHeader title="Parking" subtitle="Módulo pendiente de activación" />
          </Tabs.Panel>
        ) : null}
      </Tabs>
    </>
  )
}
