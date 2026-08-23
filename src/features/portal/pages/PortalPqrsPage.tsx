import {
  Alert,
  Button,
  Group,
  Loader,
  Select,
  Stack,
  Text,
  Textarea,
  TextInput,
  Title,
} from '@mantine/core'
import { useForm } from '@mantine/form'
import { notifications } from '@mantine/notifications'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { api } from '../../../api/client'
import { getApiErrorMessage } from '../../../api/errors'
import type { PortalHome, PqrsCase } from '../../../api/types'
import { FeatureCodes } from '../../../lib/permissions'
import { formDrawerSelectComboboxProps } from '../../../lib/formDrawerSelect'
import { asEnumName, enumIndex, labelForOption } from '../../../lib/amenitiesEnums'
import { PQRS_CATEGORY_OPTIONS, PQRS_STATUS_OPTIONS } from '../../../lib/pqrsEnums'
import { useAuthStore } from '../../../stores/authStore'
import { portalPqrsFormRequiresCategory } from '../lib/portalPqrsFormRequiresCategory'

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
    return iso.slice(0, 16)
  }
}

export function PortalPqrsPage() {
  const canCreate = useAuthStore((s) => s.hasPermission(FeatureCodes.pqrsCreate))
  const queryClient = useQueryClient()
  const location = useLocation()
  const [mode, setMode] = useState<'list' | 'new' | string>(
    location.pathname.endsWith('/nuevo') ? 'new' : 'list',
  )

  const homeQuery = useQuery({
    queryKey: ['portalHome'],
    enabled: canCreate,
    queryFn: async () => {
      const { data } = await api.get<PortalHome>('/api/portal/home')
      return data
    },
  })

  const listQuery = useQuery({
    queryKey: ['portalPqrs'],
    enabled: canCreate,
    queryFn: async () => {
      const { data } = await api.get<PqrsCase[]>('/api/portal/pqrs')
      return data
    },
  })

  const detailQuery = useQuery({
    queryKey: ['portalPqrs', mode],
    enabled: canCreate && mode !== 'list' && mode !== 'new',
    queryFn: async () => {
      const { data } = await api.get<PqrsCase>(`/api/portal/pqrs/${mode}`)
      return data
    },
  })

  const form = useForm({
    initialValues: {
      unitId: '',
      category: 'Petition',
      subject: '',
      description: '',
    },
  })

  const createMutation = useMutation({
    mutationFn: async () => {
      const check = portalPqrsFormRequiresCategory(form.values)
      if (!check.ok)
        throw new Error(check.error)
      const { data } = await api.post<PqrsCase>('/api/portal/pqrs', {
        unitId: form.values.unitId,
        category: enumIndex(form.values.category, PQRS_CATEGORY_OPTIONS),
        subject: form.values.subject.trim(),
        description: form.values.description.trim(),
      })
      return data
    },
    onSuccess: (data) => {
      notifications.show({ title: 'Enviado', message: 'Tu PQRS quedó registrado', color: 'teal' })
      queryClient.invalidateQueries({ queryKey: ['portalPqrs'] })
      setMode(data.id)
    },
    onError: (err) =>
      notifications.show({ title: 'Error', message: getApiErrorMessage(err), color: 'red' }),
  })

  if (!canCreate) {
    return (
      <Alert color="orange" title="Sin permiso">
        No tienes permiso para crear PQRS.
      </Alert>
    )
  }

  if (homeQuery.isLoading || listQuery.isLoading) {
    return (
      <Stack align="center" py="xl">
        <Loader color="teal" />
      </Stack>
    )
  }

  const units = homeQuery.data?.units ?? []
  const cases = listQuery.data ?? []

  if (mode === 'new') {
    return (
      <Stack gap="lg">
        <Group justify="space-between">
          <Title order={2} style={{ fontFamily: 'Fraunces, Georgia, serif' }}>
            Nuevo PQRS
          </Title>
          <Button variant="default" size="sm" onClick={() => setMode('list')}>
            Volver
          </Button>
        </Group>
        {units.length === 0 ? (
          <Alert color="red" title="Sin unidad">
            No tienes una unidad vinculada. No puedes crear PQRS.
          </Alert>
        ) : (
          <form
            onSubmit={form.onSubmit(() => createMutation.mutate())}
            className="portal-unit-card"
            style={{ padding: 16 }}
          >
            <Stack gap="sm">
              <Select
                label="Unidad"
                required
                data={units.map((u) => ({ value: u.unitId, label: u.code }))}
                comboboxProps={formDrawerSelectComboboxProps}
                {...form.getInputProps('unitId')}
              />
              <Select
                label="Categoría"
                required
                data={[...PQRS_CATEGORY_OPTIONS]}
                comboboxProps={formDrawerSelectComboboxProps}
                {...form.getInputProps('category')}
              />
              <TextInput label="Asunto" required {...form.getInputProps('subject')} />
              <Textarea label="Descripción" required minRows={4} {...form.getInputProps('description')} />
              <Button type="submit" loading={createMutation.isPending}>
                Enviar PQRS
              </Button>
            </Stack>
          </form>
        )}
      </Stack>
    )
  }

  if (mode !== 'list') {
    if (detailQuery.isLoading) {
      return (
        <Stack align="center" py="xl">
          <Loader color="teal" />
        </Stack>
      )
    }
    const item = detailQuery.data
    if (!item) {
      return (
        <Alert color="red" title="No encontrado">
          No encontramos ese caso.
          <Button mt="sm" variant="default" onClick={() => setMode('list')}>
            Volver
          </Button>
        </Alert>
      )
    }
    return (
      <Stack gap="lg">
        <Group justify="space-between">
          <Title order={2} style={{ fontFamily: 'Fraunces, Georgia, serif' }}>
            {item.subject}
          </Title>
          <Button variant="default" size="sm" onClick={() => setMode('list')}>
            Volver
          </Button>
        </Group>
        <div className="portal-unit-card">
          <Text size="sm" c="dimmed">
            {labelForOption(PQRS_CATEGORY_OPTIONS, item.category)} ·{' '}
            {labelForOption(PQRS_STATUS_OPTIONS, item.status)}
            {item.unitCode ? ` · Unidad ${item.unitCode}` : ''}
          </Text>
          <Text mt="sm" style={{ whiteSpace: 'pre-wrap' }}>
            {item.description}
          </Text>
        </div>
        <Stack gap="sm">
          <Text fw={600} size="sm">
            Historial
          </Text>
          {(item.comments ?? []).length === 0 ? (
            <Text size="sm" c="dimmed">
              Aún no hay respuestas.
            </Text>
          ) : (
            (item.comments ?? []).map((c) => (
              <div key={c.id} className="portal-unit-card">
                <Text size="xs" c="dimmed">
                  {c.authorDisplayName} · {formatWhen(c.postedAtUtc)}
                </Text>
                <Text size="sm" mt={4} style={{ whiteSpace: 'pre-wrap' }}>
                  {c.body}
                </Text>
              </div>
            ))
          )}
        </Stack>
      </Stack>
    )
  }

  return (
    <Stack gap="lg">
      <Group justify="space-between" align="flex-start">
        <Stack gap={4}>
          <Title order={2} style={{ fontFamily: 'Fraunces, Georgia, serif' }}>
            Mis PQRS
          </Title>
          <Text c="dimmed" size="sm">
            Peticiones, quejas, reclamos y sugerencias
          </Text>
        </Stack>
        <Group gap="xs">
          <Button component={Link} to="/portal" variant="default" size="sm">
            Inicio
          </Button>
          <Button
            size="sm"
            onClick={() => {
              form.setValues({
                unitId: units[0]?.unitId ?? '',
                category: 'Petition',
                subject: '',
                description: '',
              })
              setMode('new')
            }}
          >
            Nuevo
          </Button>
        </Group>
      </Group>

      {listQuery.isError ? (
        <Alert color="red" title="No se pudo cargar">
          {getApiErrorMessage(listQuery.error)}
        </Alert>
      ) : cases.length === 0 ? (
        <Alert color="gray" title="Sin casos">
          Aún no has creado ningún PQRS.
        </Alert>
      ) : (
        <Stack gap="sm">
          {cases.map((c) => (
            <button
              key={c.id}
              type="button"
              className="portal-unit-card"
              style={{ textAlign: 'left', width: '100%', cursor: 'pointer' }}
              onClick={() => setMode(c.id)}
            >
              <Text fw={600} size="sm">
                {c.subject}
              </Text>
              <Text size="xs" c="dimmed">
                {labelForOption(PQRS_CATEGORY_OPTIONS, asEnumName(c.category, PQRS_CATEGORY_OPTIONS))} ·{' '}
                {labelForOption(PQRS_STATUS_OPTIONS, asEnumName(c.status, PQRS_STATUS_OPTIONS))}
                {c.unitCode ? ` · ${c.unitCode}` : ''} · {formatWhen(c.createdAtUtc)}
              </Text>
            </button>
          ))}
        </Stack>
      )}
    </Stack>
  )
}
