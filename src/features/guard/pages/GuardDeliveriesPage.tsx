import { Alert, Loader, Stack, Text, Title } from '@mantine/core'
import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { api } from '../../../api/client'
import { getApiErrorMessage } from '../../../api/errors'
import type { ReceptionItem } from '../../../api/types'
import { buildListUrl, defaultListQuery } from '../../../api/paging'
import { FeatureCodes } from '../../../lib/permissions'
import { useAuthStore } from '../../../stores/authStore'

export function GuardDeliveriesPage() {
  const can = useAuthStore((s) => s.hasPermission(FeatureCodes.receptionManage))

  const listQuery = useQuery({
    queryKey: ['guardReceptionPending'],
    enabled: can,
    queryFn: async () => {
      const state = {
        ...defaultListQuery(),
        pageSize: 40,
        columnFilters: { status: 'PendingPickup' },
        sortBy: 'receivedatutc',
        sortDir: 'desc' as const,
      }
      const { data } = await api.get<{ items: ReceptionItem[] }>(
        buildListUrl('/api/ReceptionItems', state),
      )
      return data.items
    },
  })

  if (!can) {
    return <Alert color="orange">Sin permiso de entregas.</Alert>
  }

  if (listQuery.isLoading) {
    return (
      <Stack align="center" py="xl">
        <Loader color="teal" />
      </Stack>
    )
  }

  if (listQuery.isError) {
    return <Alert color="red">{getApiErrorMessage(listQuery.error)}</Alert>
  }

  const items = listQuery.data ?? []

  return (
    <Stack gap="md">
      <div>
        <Title order={3} style={{ fontFamily: 'Fraunces, Georgia, serif' }}>
          Entregas
        </Title>
        <Text size="sm" c="dimmed">
          Pendientes de retiro ·{' '}
          <Text span component={Link} to="/properties" c="teal.3">
            vista admin
          </Text>
        </Text>
      </div>
      {items.length === 0 ? (
        <Alert color="gray">No hay entregas pendientes.</Alert>
      ) : (
        items.map((item) => (
          <div key={item.id} className="guard-card">
            <Text fw={600} size="sm">
              {item.unitCode ?? 'Unidad'} · {item.personName ?? item.recipientName ?? '—'}
            </Text>
            <Text size="xs" c="dimmed">
              {item.carrierOrSender || item.trackingOrReference || item.notes || 'Sin detalle'}
            </Text>
          </div>
        ))
      )}
    </Stack>
  )
}
