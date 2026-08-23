import {
  Alert,
  Button,
  Group,
  NumberInput,
  Stack,
  Switch,
  Table,
  Text,
  Textarea,
  TextInput,
  Title,
} from '@mantine/core'
import { useForm } from '@mantine/form'
import { notifications } from '@mantine/notifications'
import { useMutation, useQuery } from '@tanstack/react-query'
import { useEffect, useState } from 'react'
import { api } from '../../../api/client'
import { getApiErrorMessage } from '../../../api/errors'
import type { DunningRule, DunningSendLog } from '../../../api/types'
import { PageHeader } from '../../../components/shared/PageHeader'
import { useInvalidate } from '../../../hooks/useInvalidate'
import { usePropertyId } from '../../../hooks/usePropertyId'
import { formatMoney } from '../../../lib/money'
import {
  dunningSettingsSavesRule,
  type DunningRuleFormValues,
} from '../lib/dunningSettingsSavesRule'

const DEFAULT_SUBJECT = 'Recordatorio de mora — unidad {{unitCode}}'
const DEFAULT_BODY =
  '<p>Hola {{personName}},</p><p>La unidad <strong>{{unitCode}}</strong> tiene un saldo en mora de {{balance}} COP ({{daysOverdue}} días).</p><p>Por favor regularice su cuota.</p>'

export function DunningPage() {
  const propertyId = usePropertyId()
  const invalidate = useInvalidate(['dunning-rules', 'dunning-sends'])
  const [editingId, setEditingId] = useState<string | null>(null)
  const [lastSaved, setLastSaved] = useState<DunningRuleFormValues | null>(null)

  const rulesQuery = useQuery({
    queryKey: ['dunning-rules', propertyId],
    queryFn: async () => {
      const { data } = await api.get<DunningRule[]>('/api/dunning/rules', {
        params: { horizontalPropertyId: propertyId },
      })
      return data
    },
  })

  const sendsQuery = useQuery({
    queryKey: ['dunning-sends', propertyId],
    queryFn: async () => {
      const { data } = await api.get<DunningSendLog[]>('/api/dunning/sends', {
        params: { horizontalPropertyId: propertyId, take: 30 },
      })
      return data
    },
  })

  const form = useForm<DunningRuleFormValues>({
    initialValues: {
      daysOverdue: 5,
      isEnabled: false,
      cooldownDays: 7,
      emailSubjectTemplate: DEFAULT_SUBJECT,
      emailBodyTemplate: DEFAULT_BODY,
    },
    validate: {
      daysOverdue: (v) => (v < 1 ? 'Mínimo 1 día' : null),
      cooldownDays: (v) => (v < 1 ? 'Mínimo 1 día' : null),
      emailSubjectTemplate: (v) => (!v.trim() ? 'Obligatorio' : null),
      emailBodyTemplate: (v) => (!v.trim() ? 'Obligatorio' : null),
    },
  })

  useEffect(() => {
    if (!rulesQuery.data?.length || editingId) return
    const first = rulesQuery.data[0]
    form.setValues({
      daysOverdue: first.daysOverdue,
      isEnabled: first.isEnabled,
      cooldownDays: first.cooldownDays,
      emailSubjectTemplate: first.emailSubjectTemplate,
      emailBodyTemplate: first.emailBodyTemplate,
    })
    setEditingId(first.id)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rulesQuery.data])

  const saveMutation = useMutation({
    mutationFn: async (values: DunningRuleFormValues) => {
      const before = { ...values }
      const { data } = await api.put<DunningRule>('/api/dunning/rules', {
        id: editingId,
        horizontalPropertyId: propertyId,
        ...values,
      })
      return { data, before }
    },
    onSuccess: ({ data, before }) => {
      const after: DunningRuleFormValues = {
        daysOverdue: data.daysOverdue,
        isEnabled: data.isEnabled,
        cooldownDays: data.cooldownDays,
        emailSubjectTemplate: data.emailSubjectTemplate,
        emailBodyTemplate: data.emailBodyTemplate,
      }
      setLastSaved(after)
      setEditingId(data.id)
      const ok = dunningSettingsSavesRule(before, after)
      notifications.show({
        title: ok ? 'Regla guardada' : 'Guardado',
        message: ok
          ? 'Recordatorios de mora actualizados'
          : 'La regla se guardó con ajustes del servidor',
        color: 'teal',
      })
      invalidate()
    },
    onError: (err) =>
      notifications.show({ title: 'Error', message: getApiErrorMessage(err), color: 'red' }),
  })

  const runMutation = useMutation({
    mutationFn: async () => {
      const { data } = await api.post<{ enqueued: number }>('/api/dunning/run')
      return data
    },
    onSuccess: (data) => {
      notifications.show({
        title: 'Job ejecutado',
        message: `Encolados: ${data.enqueued}`,
        color: 'teal',
      })
      invalidate()
    },
    onError: (err) =>
      notifications.show({ title: 'Error', message: getApiErrorMessage(err), color: 'red' }),
  })

  const resetNew = () => {
    setEditingId(null)
    form.setValues({
      daysOverdue: 5,
      isEnabled: true,
      cooldownDays: 7,
      emailSubjectTemplate: DEFAULT_SUBJECT,
      emailBodyTemplate: DEFAULT_BODY,
    })
  }

  return (
    <Stack gap="lg">
      <PageHeader
        title="Cobranza / mora"
        description="Configure días de mora, plantillas de email y revise los últimos envíos. El worker encola recordatorios (Email:Enabled controla SMTP)."
      />

      <Group justify="space-between">
        <Title order={4}>Regla de recordatorio</Title>
        <Group gap="sm">
          <Button variant="default" size="sm" onClick={resetNew}>
            Nueva regla
          </Button>
          <Button
            variant="light"
            size="sm"
            loading={runMutation.isPending}
            onClick={() => runMutation.mutate()}
          >
            Ejecutar ahora
          </Button>
        </Group>
      </Group>

      {rulesQuery.isError ? (
        <Alert color="red">{getApiErrorMessage(rulesQuery.error)}</Alert>
      ) : (
        <form onSubmit={form.onSubmit((v) => saveMutation.mutate(v))}>
          <Stack gap="sm" maw={640}>
            <Switch
              label="Recordatorios activos"
              {...form.getInputProps('isEnabled', { type: 'checkbox' })}
            />
            <NumberInput
              label="Días de mora"
              description="Envía cuando el cargo abierto más antiguo supera este umbral"
              min={1}
              {...form.getInputProps('daysOverdue')}
            />
            <NumberInput
              label="Cooldown (días)"
              description="No reenviar a la misma unidad antes de este plazo"
              min={1}
              {...form.getInputProps('cooldownDays')}
            />
            <TextInput label="Asunto" {...form.getInputProps('emailSubjectTemplate')} />
            <Textarea
              label="Cuerpo HTML"
              minRows={4}
              description="Placeholders: {{unitCode}} {{personName}} {{balance}} {{daysOverdue}}"
              {...form.getInputProps('emailBodyTemplate')}
            />
            <Button type="submit" loading={saveMutation.isPending}>
              Guardar regla
            </Button>
            {lastSaved ? (
              <Text size="xs" c="dimmed">
                Último guardado OK (Spec DunningSettings_SavesRule)
              </Text>
            ) : null}
          </Stack>
        </form>
      )}

      {(rulesQuery.data?.length ?? 0) > 1 ? (
        <Stack gap="xs">
          <Text fw={600} size="sm">
            Otras reglas
          </Text>
          {rulesQuery.data!.map((r) => (
            <Button
              key={r.id}
              variant={editingId === r.id ? 'filled' : 'subtle'}
              size="compact-sm"
              onClick={() => {
                setEditingId(r.id)
                form.setValues({
                  daysOverdue: r.daysOverdue,
                  isEnabled: r.isEnabled,
                  cooldownDays: r.cooldownDays,
                  emailSubjectTemplate: r.emailSubjectTemplate,
                  emailBodyTemplate: r.emailBodyTemplate,
                })
              }}
            >
              {r.daysOverdue}d · {r.isEnabled ? 'activa' : 'off'}
            </Button>
          ))}
        </Stack>
      ) : null}

      <Stack gap="sm">
        <Title order={4}>Últimos envíos</Title>
        {sendsQuery.isLoading ? (
          <Text c="dimmed" size="sm">
            Cargando…
          </Text>
        ) : sendsQuery.isError ? (
          <Alert color="red">{getApiErrorMessage(sendsQuery.error)}</Alert>
        ) : (sendsQuery.data?.length ?? 0) === 0 ? (
          <Text c="dimmed" size="sm">
            Aún no hay envíos registrados.
          </Text>
        ) : (
          <Table striped highlightOnHover>
            <Table.Thead>
              <Table.Tr>
                <Table.Th>Fecha</Table.Th>
                <Table.Th>Unidad</Table.Th>
                <Table.Th>Email</Table.Th>
                <Table.Th>Días</Table.Th>
                <Table.Th>Saldo</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {sendsQuery.data!.map((s) => (
                <Table.Tr key={s.id}>
                  <Table.Td>{new Date(s.sentAtUtc).toLocaleString()}</Table.Td>
                  <Table.Td>{s.unitCode ?? '—'}</Table.Td>
                  <Table.Td>{s.toEmail}</Table.Td>
                  <Table.Td>{s.daysOverdueSnapshot}</Table.Td>
                  <Table.Td>{formatMoney(s.balanceSnapshot)}</Table.Td>
                </Table.Tr>
              ))}
            </Table.Tbody>
          </Table>
        )}
      </Stack>
    </Stack>
  )
}
