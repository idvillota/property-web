import { Alert, Button, Group, Select, Stack, Text, TextInput } from '@mantine/core'
import { useQuery } from '@tanstack/react-query'
import { useMemo, useState } from 'react'
import { api } from '../../../api/client'
import { getApiErrorMessage } from '../../../api/errors'
import { PageHeader } from '../../../components/shared/PageHeader'
import { auditPageFilters } from '../lib/auditPageFilters'

export type AuditEvent = {
  id: string
  actorUserId: string | null
  entityType: string
  entityId: string | null
  action: string
  beforeJson: string | null
  afterJson: string | null
  occurredAtUtc: string
}

function formatWhen(iso: string) {
  try {
    return new Date(iso).toLocaleString('es-CO', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  } catch {
    return iso
  }
}

export function AuditPage() {
  const [actorUserId, setActorUserId] = useState('')
  const [entityType, setEntityType] = useState('')
  const [entityId, setEntityId] = useState('')
  const [fromUtc, setFromUtc] = useState('')
  const [toUtc, setToUtc] = useState('')

  const queryParams = useMemo(() => {
    const params = new URLSearchParams()
    params.set('take', '100')
    if (actorUserId.trim()) params.set('actorUserId', actorUserId.trim())
    if (entityType.trim()) params.set('entityType', entityType.trim())
    if (entityId.trim()) params.set('entityId', entityId.trim())
    if (fromUtc) params.set('fromUtc', new Date(fromUtc).toISOString())
    if (toUtc) params.set('toUtc', new Date(toUtc).toISOString())
    return params.toString()
  }, [actorUserId, entityType, entityId, fromUtc, toUtc])

  void auditPageFilters({ entityType, actorUserId, fromUtc, toUtc })

  const listQuery = useQuery({
    queryKey: ['audit-events', queryParams],
    queryFn: async () => {
      const { data } = await api.get<AuditEvent[]>(`/api/audit-events?${queryParams}`)
      return data
    },
  })

  return (
    <Stack gap="md">
      <PageHeader
        title="Auditoría"
        description="Historial de cambios: actor, entidad y diferencias"
      />

      <Group grow align="flex-end" wrap="wrap">
        <TextInput
          label="Usuario (UUID)"
          placeholder="ActorUserId"
          value={actorUserId}
          onChange={(e) => setActorUserId(e.currentTarget.value)}
        />
        <Select
          label="Entidad"
          clearable
          searchable
          data={['Role', 'Payment', 'PaymentIntent', 'VisitLog', 'PspWebhook']}
          value={entityType || null}
          onChange={(v) => setEntityType(v ?? '')}
        />
        <TextInput
          label="Id entidad"
          value={entityId}
          onChange={(e) => setEntityId(e.currentTarget.value)}
        />
        <TextInput
          label="Desde"
          type="datetime-local"
          value={fromUtc}
          onChange={(e) => setFromUtc(e.currentTarget.value)}
        />
        <TextInput
          label="Hasta"
          type="datetime-local"
          value={toUtc}
          onChange={(e) => setToUtc(e.currentTarget.value)}
        />
        <Button
          variant="default"
          onClick={() => {
            setActorUserId('')
            setEntityType('')
            setEntityId('')
            setFromUtc('')
            setToUtc('')
          }}
        >
          Limpiar
        </Button>
      </Group>

      {listQuery.isError ? (
        <Alert color="red">{getApiErrorMessage(listQuery.error)}</Alert>
      ) : null}

      {(listQuery.data ?? []).length === 0 && !listQuery.isLoading ? (
        <Alert color="gray">Sin eventos para estos filtros.</Alert>
      ) : (
        <Stack gap="sm">
          {(listQuery.data ?? []).map((evt) => (
            <div key={evt.id} style={{ borderTop: '1px solid var(--mantine-color-gray-3)', paddingTop: 12 }}>
              <Group justify="space-between" wrap="wrap" gap="xs">
                <Text size="sm" fw={600}>
                  {evt.action}
                </Text>
                <Text size="xs" c="dimmed">
                  {formatWhen(evt.occurredAtUtc)}
                </Text>
              </Group>
              <Text size="xs" c="dimmed">
                {evt.entityType}
                {evt.entityId ? ` · ${evt.entityId}` : ''}
                {evt.actorUserId ? ` · actor ${evt.actorUserId.slice(0, 8)}…` : ''}
              </Text>
              {evt.afterJson ? (
                <Text size="xs" mt={6} style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                  {evt.afterJson.slice(0, 400)}
                  {evt.afterJson.length > 400 ? '…' : ''}
                </Text>
              ) : null}
            </div>
          ))}
        </Stack>
      )}
    </Stack>
  )
}
