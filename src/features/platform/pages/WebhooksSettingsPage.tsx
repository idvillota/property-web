import {
  Alert,
  Button,
  Group,
  Loader,
  MultiSelect,
  Stack,
  Switch,
  Table,
  Text,
  TextInput,
} from '@mantine/core'
import { useForm } from '@mantine/form'
import { notifications } from '@mantine/notifications'
import { useMutation, useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import { api } from '../../../api/client'
import { getApiErrorMessage } from '../../../api/errors'
import type { WebhookSubscription } from '../../../api/types'
import { FormDrawer } from '../../../components/crud/FormDrawer'
import { PageHeader } from '../../../components/shared/PageHeader'
import { useInvalidate } from '../../../hooks/useInvalidate'
import { formDrawerSelectComboboxProps } from '../../../lib/formDrawerSelect'
import {
  WebhookSettings_SaveEndpoint,
  type WebhookSavePayload,
} from '../lib/webhookSettingsSaveEndpoint'

const EVENT_TYPE_OPTIONS = [
  { value: 'PaymentPosted', label: 'Pago registrado' },
  { value: 'VisitApproved', label: 'Visita aprobada' },
  { value: 'PqrsCreated', label: 'PQRS creado' },
] as const

type WebhookFormValues = {
  name: string
  targetUrl: string
  secret: string
  eventTypes: string[]
  isActive: boolean
}

function toFormValues(item?: WebhookSubscription | null): WebhookFormValues {
  return {
    name: item?.name ?? '',
    targetUrl: item?.targetUrl ?? '',
    secret: item?.secret ?? '',
    eventTypes: item?.eventTypes ?? [],
    isActive: item?.isActive ?? true,
  }
}

export function WebhooksSettingsPage() {
  const [drawer, setDrawer] = useState<'create' | WebhookSubscription | null>(null)
  const invalidate = useInvalidate(['webhook-subscriptions'])

  const listQuery = useQuery({
    queryKey: ['webhook-subscriptions'],
    queryFn: async () => {
      const { data } = await api.get<WebhookSubscription[]>('/api/settings/webhooks')
      return data
    },
  })

  const form = useForm<WebhookFormValues>({
    initialValues: toFormValues(),
    validate: {
      name: (v) => (!v.trim() ? 'Obligatorio' : null),
      targetUrl: (v) => (!v.trim() ? 'Obligatorio' : null),
      secret: (v) =>
        drawer === 'create' && !v.trim() ? 'Obligatorio' : null,
      eventTypes: (v) => (v.length === 0 ? 'Seleccione al menos un evento' : null),
    },
  })

  const openCreate = () => {
    form.setValues(toFormValues())
    setDrawer('create')
  }

  const openEdit = (item: WebhookSubscription) => {
    form.setValues(toFormValues(item))
    setDrawer(item)
  }

  const saveMutation = useMutation({
    mutationFn: async (values: WebhookFormValues) => {
      const payload: WebhookSavePayload = {
        name: values.name.trim(),
        targetUrl: values.targetUrl.trim(),
        secret: values.secret.trim(),
        eventTypes: values.eventTypes,
        isActive: values.isActive,
      }
      const validation = WebhookSettings_SaveEndpoint(payload, {
        requireSecret: drawer === 'create',
      })
      if (!validation.ok) {
        throw new Error(validation.errors.join('. '))
      }

      if (drawer === 'create') {
        const { data } = await api.post<WebhookSubscription>('/api/settings/webhooks', payload)
        return data
      }
      const { data } = await api.put<WebhookSubscription>(
        `/api/settings/webhooks/${drawer!.id}`,
        {
          ...payload,
          secret: payload.secret || null,
        },
      )
      return data
    },
    onSuccess: () => {
      notifications.show({ title: 'Guardado', message: 'Webhook configurado', color: 'teal' })
      setDrawer(null)
      invalidate()
    },
    onError: (err) =>
      notifications.show({ title: 'Error', message: getApiErrorMessage(err), color: 'red' }),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/api/settings/webhooks/${id}`),
    onSuccess: () => {
      notifications.show({ title: 'Eliminado', message: 'Suscripción desactivada', color: 'gray' })
      invalidate()
    },
    onError: (err) =>
      notifications.show({ title: 'Error', message: getApiErrorMessage(err), color: 'red' }),
  })

  return (
    <Stack gap="lg" maw={900}>
      <PageHeader
        title="Webhooks e integraciones"
        description="Registre URLs de partners para recibir eventos firmados (pagos, visitas, PQRS)."
      />

      <Group justify="flex-end">
        <Button onClick={openCreate}>Nuevo endpoint</Button>
      </Group>

      {listQuery.isLoading ? (
        <Loader />
      ) : listQuery.isError ? (
        <Alert color="red">{getApiErrorMessage(listQuery.error)}</Alert>
      ) : (listQuery.data?.length ?? 0) === 0 ? (
        <Alert color="gray">Aún no hay endpoints registrados.</Alert>
      ) : (
        <Table striped highlightOnHover>
          <Table.Thead>
            <Table.Tr>
              <Table.Th>Nombre</Table.Th>
              <Table.Th>URL</Table.Th>
              <Table.Th>Eventos</Table.Th>
              <Table.Th>Activo</Table.Th>
              <Table.Th />
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {listQuery.data!.map((item) => (
              <Table.Tr key={item.id}>
                <Table.Td>{item.name}</Table.Td>
                <Table.Td>
                  <Text size="sm" lineClamp={1}>
                    {item.targetUrl}
                  </Text>
                </Table.Td>
                <Table.Td>{item.eventTypes.join(', ')}</Table.Td>
                <Table.Td>{item.isActive ? 'Sí' : 'No'}</Table.Td>
                <Table.Td>
                  <Group gap="xs" wrap="nowrap">
                    <Button size="compact-xs" variant="light" onClick={() => openEdit(item)}>
                      Editar
                    </Button>
                    <Button
                      size="compact-xs"
                      variant="subtle"
                      color="red"
                      onClick={() => {
                        if (window.confirm(`¿Eliminar webhook "${item.name}"?`))
                          deleteMutation.mutate(item.id)
                      }}
                    >
                      Eliminar
                    </Button>
                  </Group>
                </Table.Td>
              </Table.Tr>
            ))}
          </Table.Tbody>
        </Table>
      )}

      <FormDrawer
        opened={drawer !== null}
        onClose={() => setDrawer(null)}
        title={drawer === 'create' ? 'Nuevo webhook' : 'Editar webhook'}
      >
        <form onSubmit={form.onSubmit((v) => saveMutation.mutate(v))}>
          <Stack gap="sm">
            <TextInput label="Nombre" required {...form.getInputProps('name')} />
            <TextInput
              label="URL destino"
              required
              placeholder="https://partner.example/hooks/property"
              {...form.getInputProps('targetUrl')}
            />
            <TextInput
              label="Secreto (HMAC)"
              required={drawer === 'create'}
              description={
                drawer === 'create'
                  ? 'Se usa para firmar el payload enviado al partner'
                  : 'Deje vacío para conservar el secreto actual'
              }
              {...form.getInputProps('secret')}
            />
            <MultiSelect
              label="Tipos de evento"
              required
              data={[...EVENT_TYPE_OPTIONS]}
              comboboxProps={formDrawerSelectComboboxProps}
              {...form.getInputProps('eventTypes')}
            />
            <Switch label="Activo" {...form.getInputProps('isActive', { type: 'checkbox' })} />
            <Button type="submit" loading={saveMutation.isPending}>
              Guardar
            </Button>
          </Stack>
        </form>
      </FormDrawer>
    </Stack>
  )
}
