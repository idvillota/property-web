import { Alert, Button, Group, Loader, Stack, Text, Title } from '@mantine/core'
import { notifications } from '@mantine/notifications'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '../../../api/client'
import { getApiErrorMessage } from '../../../api/errors'
import type { VisitLog } from '../../../api/types'
import { FeatureCodes } from '../../../lib/permissions'
import { useAuthStore } from '../../../stores/authStore'
import { portalVisitApprovalButtons } from '../lib/portalVisitApprovalButtons'

function formatWhen(iso: string) {
  try {
    return new Date(iso).toLocaleString('es-CO', {
      day: '2-digit',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    })
  } catch {
    return iso
  }
}

export function PortalVisitsPage() {
  const can = useAuthStore((s) => s.hasPermission(FeatureCodes.portalVisits))
  const queryClient = useQueryClient()

  const listQuery = useQuery({
    queryKey: ['portalVisits'],
    enabled: can,
    queryFn: async () => {
      const { data } = await api.get<VisitLog[]>('/api/portal/visitas')
      return data
    },
    refetchInterval: 5000,
  })

  const approveMutation = useMutation({
    mutationFn: async (id: string) => {
      const { data } = await api.post<VisitLog>(`/api/portal/visitas/${id}/approve`)
      return data
    },
    onSuccess: () => {
      notifications.show({ title: 'Aprobada', message: 'Visita autorizada', color: 'teal' })
      queryClient.invalidateQueries({ queryKey: ['portalVisits'] })
    },
    onError: (err) =>
      notifications.show({ title: 'Error', message: getApiErrorMessage(err), color: 'red' }),
  })

  const rejectMutation = useMutation({
    mutationFn: async (id: string) => {
      const { data } = await api.post<VisitLog>(`/api/portal/visitas/${id}/reject`)
      return data
    },
    onSuccess: () => {
      notifications.show({ title: 'Rechazada', message: 'Visita rechazada', color: 'orange' })
      queryClient.invalidateQueries({ queryKey: ['portalVisits'] })
    },
    onError: (err) =>
      notifications.show({ title: 'Error', message: getApiErrorMessage(err), color: 'red' }),
  })

  if (!can) {
    return <Alert color="orange">Sin permiso para autorizar visitas.</Alert>
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
        <Title order={2} style={{ fontFamily: 'Fraunces, Georgia, serif' }}>
          Visitas pendientes
        </Title>
        <Text size="sm" c="dimmed" mt={4}>
          Aprueba o rechaza visitantes en portería para tus unidades
        </Text>
      </div>

      {items.length === 0 ? (
        <Alert color="gray">No hay visitas pendientes de autorización.</Alert>
      ) : (
        items.map((visit) => {
          const buttons = portalVisitApprovalButtons(visit.status)
          return (
            <div key={visit.id} className="portal-unit-card">
              <Group justify="space-between" align="flex-start" wrap="wrap">
                <Stack gap={2}>
                  <Text fw={600}>{visit.visitorFullName}</Text>
                  <Text size="sm" c="dimmed">
                    Unidad {visit.unitCode} · {formatWhen(visit.enteredAtUtc)}
                  </Text>
                  {visit.approvalExpiresAtUtc ? (
                    <Text size="xs" c="dimmed">
                      Expira {formatWhen(visit.approvalExpiresAtUtc)}
                    </Text>
                  ) : null}
                </Stack>
                <Group gap="xs">
                  {buttons.showApprove ? (
                    <Button
                      size="sm"
                      color="teal"
                      loading={approveMutation.isPending}
                      onClick={() => approveMutation.mutate(visit.id)}
                    >
                      Aprobar
                    </Button>
                  ) : null}
                  {buttons.showReject ? (
                    <Button
                      size="sm"
                      variant="light"
                      color="red"
                      loading={rejectMutation.isPending}
                      onClick={() => rejectMutation.mutate(visit.id)}
                    >
                      Rechazar
                    </Button>
                  ) : null}
                </Group>
              </Group>
            </div>
          )
        })
      )}
    </Stack>
  )
}
