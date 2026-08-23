import { Alert, Button, Group, Loader, Stack, Text, Textarea, Title } from '@mantine/core'
import { notifications } from '@mantine/notifications'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { api } from '../../../api/client'
import { getApiErrorMessage } from '../../../api/errors'
import type { VisitLog } from '../../../api/types'
import { buildListUrl, defaultListQuery } from '../../../api/paging'
import { FeatureCodes } from '../../../lib/permissions'
import { useAuthStore } from '../../../stores/authStore'
import { guardNotifyButtonCallsApi } from '../lib/guardNotifyButtonCallsApi'
import { labelForOption } from '../../../lib/amenitiesEnums'

const VISIT_STATUS = [
  { value: 'Registered', label: 'Registrada' },
  { value: 'PendingApproval', label: 'Pendiente' },
  { value: 'Approved', label: 'Aprobada' },
  { value: 'Rejected', label: 'Rechazada' },
  { value: 'Expired', label: 'Expirada' },
  { value: 'Exited', label: 'Salió' },
] as const

export function GuardVisitsPage() {
  const canVisits = useAuthStore((s) => s.hasPermission(FeatureCodes.receptionVisits))
  const canIntercom = useAuthStore((s) => s.hasPermission(FeatureCodes.receptionIntercom))
  const queryClient = useQueryClient()
  const [overrideId, setOverrideId] = useState<string | null>(null)
  const [overrideReason, setOverrideReason] = useState('')
  const [notifyClicked, setNotifyClicked] = useState(false)
  const [notifyCalled, setNotifyCalled] = useState(false)

  const listQuery = useQuery({
    queryKey: ['guardVisits'],
    enabled: canVisits,
    queryFn: async () => {
      const state = {
        ...defaultListQuery(),
        pageSize: 40,
        sortBy: 'enteredatutc',
        sortDir: 'desc' as const,
      }
      const { data } = await api.get<{ items: VisitLog[] }>(buildListUrl('/api/visit-logs', state))
      return data.items
    },
    refetchInterval: 8000,
  })

  const notifyMutation = useMutation({
    mutationFn: async (id: string) => {
      setNotifyClicked(true)
      await api.post(`/api/visit-logs/${id}/notify`)
      setNotifyCalled(true)
    },
    onSuccess: () =>
      notifications.show({ title: 'Aviso enviado', message: 'Se notificó a la unidad', color: 'teal' }),
    onError: (err) =>
      notifications.show({ title: 'Error', message: getApiErrorMessage(err), color: 'red' }),
  })

  const overrideMutation = useMutation({
    mutationFn: async () => {
      await api.post(`/api/visit-logs/${overrideId}/override-approve`, {
        reason: overrideReason.trim(),
      })
    },
    onSuccess: () => {
      notifications.show({ title: 'Override', message: 'Visita aprobada por vigilante', color: 'teal' })
      setOverrideId(null)
      setOverrideReason('')
      queryClient.invalidateQueries({ queryKey: ['guardVisits'] })
    },
    onError: (err) =>
      notifications.show({ title: 'Error', message: getApiErrorMessage(err), color: 'red' }),
  })

  if (!canVisits) {
    return <Alert color="orange">Sin permiso de visitas.</Alert>
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
          Visitas
        </Title>
        <Text size="sm" c="dimmed">
          Autorizaciones y citofonía
        </Text>
      </div>

      {items.length === 0 ? (
        <Alert color="gray">Sin visitas recientes.</Alert>
      ) : (
        items.map((visit) => {
          const statusLabel = labelForOption(VISIT_STATUS, visit.status)
          const pending =
            String(visit.status) === 'PendingApproval' || visit.status === 1
          return (
            <div key={visit.id} className="guard-card">
              <Group justify="space-between" align="flex-start">
                <Stack gap={2}>
                  <Text fw={600} size="sm">
                    {visit.visitorFullName}
                  </Text>
                  <Text size="xs" c="dimmed">
                    Unidad {visit.unitCode} · {statusLabel}
                  </Text>
                </Stack>
              </Group>
              <Group gap="xs" mt="sm">
                {canIntercom && pending ? (
                  <Button
                    size="xs"
                    variant="light"
                    color="teal"
                    loading={notifyMutation.isPending}
                    onClick={() => {
                      void guardNotifyButtonCallsApi({
                        clicked: true,
                        apiCalled: false,
                        visitId: visit.id,
                      })
                      notifyMutation.mutate(visit.id)
                    }}
                  >
                    Avisar unidad
                  </Button>
                ) : null}
                {pending ? (
                  <Button
                    size="xs"
                    variant="default"
                    onClick={() => {
                      setOverrideId(visit.id)
                      setOverrideReason('')
                    }}
                  >
                    Override
                  </Button>
                ) : null}
              </Group>
            </div>
          )
        })
      )}

      {overrideId ? (
        <Stack gap="sm" className="guard-card">
          <Text fw={600} size="sm">
            Override con motivo
          </Text>
          <Textarea
            minRows={2}
            placeholder="Motivo del override"
            value={overrideReason}
            onChange={(e) => setOverrideReason(e.currentTarget.value)}
          />
          <Group>
            <Button
              size="sm"
              disabled={overrideReason.trim().length < 3}
              loading={overrideMutation.isPending}
              onClick={() => overrideMutation.mutate()}
            >
              Confirmar
            </Button>
            <Button size="sm" variant="default" onClick={() => setOverrideId(null)}>
              Cancelar
            </Button>
          </Group>
        </Stack>
      ) : null}

      {notifyClicked && notifyCalled ? (
        <Text size="xs" c="dimmed">
          Aviso registrado
        </Text>
      ) : null}
    </Stack>
  )
}
