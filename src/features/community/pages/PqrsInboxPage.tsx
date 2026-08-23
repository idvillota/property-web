import {
  Alert,
  Button,
  Group,
  Loader,
  Select,
  Stack,
  Switch,
  Text,
  Textarea,
  TextInput,
  Title,
} from '@mantine/core'
import { useForm } from '@mantine/form'
import { notifications } from '@mantine/notifications'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { api } from '../../../api/client'
import { getApiErrorMessage } from '../../../api/errors'
import type { AiSuggestPqrsResponse, PqrsCase } from '../../../api/types'
import { FormDrawer } from '../../../components/crud/FormDrawer'
import { useInvalidate } from '../../../hooks/useInvalidate'
import { usePagedListQuery } from '../../../hooks/usePagedListQuery'
import { usePagedListState } from '../../../hooks/usePagedListState'
import { usePropertyId } from '../../../hooks/usePropertyId'
import { formDrawerSelectComboboxProps } from '../../../lib/formDrawerSelect'
import { asEnumName, enumIndex, labelForOption } from '../../../lib/amenitiesEnums'
import { FeatureCodes } from '../../../lib/permissions'
import { PQRS_CATEGORY_OPTIONS, PQRS_STATUS_OPTIONS } from '../../../lib/pqrsEnums'
import { useAuthStore } from '../../../stores/authStore'
import { adminPqrsInboxFilters } from '../lib/adminPqrsInboxFilters'
import { PqrsDetail_SuggestButton } from '../lib/pqrsDetailSuggestButton'

function formatWhen(iso: string) {
  try {
    return new Date(iso).toLocaleString('es-CO', {
      day: '2-digit',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    })
  } catch {
    return iso.slice(0, 16)
  }
}

export function PqrsInboxPage() {
  const propertyId = usePropertyId()
  const canManage = useAuthStore((s) => s.hasPermission(FeatureCodes.pqrsManage))
  const canSuggest = useAuthStore((s) => s.hasPermission(FeatureCodes.aiOps))
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const invalidate = useInvalidate(['pqrs-cases'])
  const queryClient = useQueryClient()

  const list = usePagedListState('createdatutc', {
    columnFilters: { horizontalPropertyId: propertyId },
    sortDir: 'desc',
    pageSize: 25,
  })
  const listQuery = usePagedListQuery<PqrsCase>('pqrs-cases', '/api/PqrsCases', list)

  const detailQuery = useQuery({
    queryKey: ['pqrs-case', selectedId],
    enabled: Boolean(selectedId) && canManage,
    queryFn: async () => {
      const { data } = await api.get<PqrsCase>(`/api/PqrsCases/${selectedId}`)
      return data
    },
  })

  const statusForm = useForm({
    initialValues: {
      status: 'InProgress',
      comment: '',
      dueAt: '',
    },
  })

  const suggestMutation = useMutation({
    mutationFn: async (pqrsCaseId: string) => {
      const { data } = await api.post<AiSuggestPqrsResponse>(
        `/api/ai-assist/suggest-pqrs/${pqrsCaseId}`,
      )
      return data
    },
    onSuccess: (data) => {
      statusForm.setFieldValue('comment', data.draft)
      notifications.show({
        title: 'Borrador listo',
        message: 'Revise y edite la respuesta antes de enviar',
        color: 'teal',
      })
    },
    onError: (err) =>
      notifications.show({ title: 'IA no disponible', message: getApiErrorMessage(err), color: 'red' }),
  })

  const transitionMutation = useMutation({
    mutationFn: async () => {
      const { data } = await api.put<PqrsCase>(`/api/PqrsCases/${selectedId}/status`, {
        status: enumIndex(statusForm.values.status, PQRS_STATUS_OPTIONS),
        comment: statusForm.values.comment.trim() || null,
        dueAtUtc: statusForm.values.dueAt
          ? new Date(`${statusForm.values.dueAt}T23:59:59.000Z`).toISOString()
          : null,
      })
      return data
    },
    onSuccess: () => {
      notifications.show({ title: 'Actualizado', message: 'Estado del PQRS cambiado', color: 'teal' })
      statusForm.setFieldValue('comment', '')
      invalidate()
      queryClient.invalidateQueries({ queryKey: ['pqrs-case', selectedId] })
    },
    onError: (err) =>
      notifications.show({ title: 'Error', message: getApiErrorMessage(err), color: 'red' }),
  })

  if (!canManage) {
    return (
      <Alert color="orange" title="Sin permiso">
        No tienes permiso para gestionar PQRS.
      </Alert>
    )
  }

  const items = listQuery.data?.items ?? []
  const statusFilter = list.state.columnFilters.status || 'all'
  const filtered = adminPqrsInboxFilters(
    items.map((i) => ({ id: i.id, status: asEnumName(i.status, PQRS_STATUS_OPTIONS) })),
    statusFilter,
  )
  const visibleItems = items.filter((i) => filtered.some((f) => f.id === i.id))
  const detail = detailQuery.data
  const showSuggestButton =
    detail &&
    PqrsDetail_SuggestButton(asEnumName(detail.status, PQRS_STATUS_OPTIONS) ?? detail.status, canSuggest)

  return (
    <Stack gap="md">
      <Group justify="space-between">
        <div>
          <Title order={2}>Bandeja PQRS</Title>
          <Text c="dimmed" size="sm">
            Gestiona peticiones, quejas, reclamos y sugerencias
          </Text>
        </div>
      </Group>

      <Group gap="sm" wrap="wrap">
        <TextInput
          placeholder="Buscar…"
          value={list.state.search}
          onChange={(e) => list.setSearch(e.currentTarget.value)}
          style={{ flex: '1 1 180px', maxWidth: 280 }}
        />
        <Select
          placeholder="Estado"
          clearable
          data={[
            { value: 'all', label: 'Todos' },
            ...PQRS_STATUS_OPTIONS.map((o) => ({ value: o.value, label: o.label })),
          ]}
          value={statusFilter}
          onChange={(v) => list.setColumnFilter('status', !v || v === 'all' ? '' : v)}
          w={180}
          comboboxProps={formDrawerSelectComboboxProps}
        />
        <Switch
          label="Incluir inactivos"
          checked={list.state.includeInactive}
          onChange={(e) => list.setIncludeInactive(e.currentTarget.checked)}
        />
      </Group>

      {listQuery.isLoading ? (
        <Loader />
      ) : listQuery.isError ? (
        <Alert color="red">{getApiErrorMessage(listQuery.error)}</Alert>
      ) : visibleItems.length === 0 ? (
        <Alert color="gray">No hay casos con este filtro.</Alert>
      ) : (
        <Stack gap="xs">
          {visibleItems.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => {
                setSelectedId(item.id)
                statusForm.setValues({
                  status: asEnumName(item.status, PQRS_STATUS_OPTIONS) || 'InProgress',
                  comment: '',
                  dueAt: item.dueAtUtc ? item.dueAtUtc.slice(0, 10) : '',
                })
              }}
              style={{
                textAlign: 'left',
                padding: '12px 14px',
                borderRadius: 8,
                border: '1px solid var(--mantine-color-gray-3)',
                background: 'var(--mantine-color-body)',
                cursor: 'pointer',
              }}
            >
              <Group justify="space-between">
                <Text fw={600} size="sm">
                  {item.subject}
                </Text>
                <Text size="xs" c="dimmed">
                  {labelForOption(PQRS_STATUS_OPTIONS, item.status)}
                </Text>
              </Group>
              <Text size="xs" c="dimmed">
                {labelForOption(PQRS_CATEGORY_OPTIONS, item.category)}
                {item.unitCode ? ` · ${item.unitCode}` : ''}
                {item.createdByPersonName ? ` · ${item.createdByPersonName}` : ''} ·{' '}
                {formatWhen(item.createdAtUtc)}
              </Text>
            </button>
          ))}
        </Stack>
      )}

      <FormDrawer
        opened={Boolean(selectedId)}
        onClose={() => setSelectedId(null)}
        title={detail?.subject ?? 'PQRS'}
      >
        {detailQuery.isLoading || !detail ? (
          <Loader />
        ) : (
          <Stack gap="md">
            <Text size="sm" c="dimmed">
              {labelForOption(PQRS_CATEGORY_OPTIONS, detail.category)} ·{' '}
              {labelForOption(PQRS_STATUS_OPTIONS, detail.status)}
              {detail.unitCode ? ` · Unidad ${detail.unitCode}` : ''}
            </Text>
            <Text size="sm" style={{ whiteSpace: 'pre-wrap' }}>
              {detail.description}
            </Text>

            <Select
              label="Nuevo estado"
              data={[...PQRS_STATUS_OPTIONS]}
              comboboxProps={formDrawerSelectComboboxProps}
              {...statusForm.getInputProps('status')}
            />
            <Textarea
              label="Respuesta / comentario"
              minRows={3}
              {...statusForm.getInputProps('comment')}
            />
            <Group gap="sm">
              {showSuggestButton ? (
                <Button
                  variant="light"
                  loading={suggestMutation.isPending}
                  onClick={() => selectedId && suggestMutation.mutate(selectedId)}
                >
                  Sugerir respuesta
                </Button>
              ) : null}
              <Button loading={transitionMutation.isPending} onClick={() => transitionMutation.mutate()}>
                Guardar y notificar
              </Button>
            </Group>

            <Stack gap="xs">
              <Text fw={600} size="sm">
                Timeline
              </Text>
              {(detail.comments ?? []).map((c) => (
                <div key={c.id}>
                  <Text size="xs" c="dimmed">
                    {c.authorDisplayName}
                    {c.isInternal ? ' (interno)' : ''} · {formatWhen(c.postedAtUtc)}
                  </Text>
                  <Text size="sm" style={{ whiteSpace: 'pre-wrap' }}>
                    {c.body}
                  </Text>
                </div>
              ))}
            </Stack>
          </Stack>
        )}
      </FormDrawer>
    </Stack>
  )
}
