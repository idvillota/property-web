import {
  Alert,
  Button,
  Group,
  Loader,
  NumberInput,
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
import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../../../api/client'
import { getApiErrorMessage } from '../../../api/errors'
import type {
  PortalCommonArea,
  PortalHome,
  PortalReservation,
  PortalReservationSlot,
} from '../../../api/types'
import { FeatureCodes } from '../../../lib/permissions'
import { useAuthStore } from '../../../stores/authStore'
import { portalReservationsShowsAvailability } from '../lib/portalReservationsShowsAvailability'

function toLocalInputValue(d: Date) {
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

function formatRange(startIso: string, endIso: string) {
  try {
    const start = new Date(startIso)
    const end = new Date(endIso)
    const day = start.toLocaleDateString('es-CO', {
      weekday: 'short',
      day: '2-digit',
      month: 'short',
    })
    const t0 = start.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })
    const t1 = end.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })
    return `${day} · ${t0} – ${t1}`
  } catch {
    return `${startIso} – ${endIso}`
  }
}

export function PortalReservationsPage() {
  const hasPermission = useAuthStore((s) => s.hasPermission)
  const canBook = hasPermission(FeatureCodes.portalReservations)
  const queryClient = useQueryClient()
  const [areaId, setAreaId] = useState<string | null>(null)

  const homeQuery = useQuery({
    queryKey: ['portalHome'],
    enabled: canBook,
    queryFn: async () => {
      const { data } = await api.get<PortalHome>('/api/portal/home')
      return data
    },
  })

  const defaultStart = useMemo(() => {
    const d = new Date()
    d.setDate(d.getDate() + 1)
    d.setHours(10, 0, 0, 0)
    return d
  }, [])

  const form = useForm({
    initialValues: {
      unitId: '',
      startsLocal: toLocalInputValue(defaultStart),
      endsLocal: toLocalInputValue(new Date(defaultStart.getTime() + 2 * 60 * 60 * 1000)),
      attendeesCount: 1,
      notes: '',
    },
    validate: {
      unitId: (v) => (!v ? 'Obligatorio' : null),
      startsLocal: (v) => (!v ? 'Obligatorio' : null),
      endsLocal: (v) => (!v ? 'Obligatorio' : null),
    },
  })

  // Prefer first home unit once loaded
  useEffect(() => {
    const first = homeQuery.data?.units?.[0]?.unitId
    if (first && !form.values.unitId) form.setFieldValue('unitId', first)
  }, [homeQuery.data, form])

  const areasQuery = useQuery({
    queryKey: ['portalReservationAreas'],
    enabled: canBook,
    queryFn: async () => {
      const { data } = await api.get<PortalCommonArea[]>('/api/portal/reservas/areas')
      return data
    },
  })

  const mineQuery = useQuery({
    queryKey: ['portalMyReservations'],
    enabled: canBook,
    queryFn: async () => {
      const { data } = await api.get<PortalReservation[]>('/api/portal/reservas')
      return data
    },
  })

  const range = useMemo(() => {
    const from = new Date()
    from.setHours(0, 0, 0, 0)
    const to = new Date(from)
    to.setDate(to.getDate() + 14)
    return { fromUtc: from.toISOString(), toUtc: to.toISOString() }
  }, [])

  const occupiedQuery = useQuery({
    queryKey: ['portalOccupiedSlots', areaId, range.fromUtc, range.toUtc],
    enabled: canBook && !!areaId,
    queryFn: async () => {
      const { data } = await api.get<PortalReservationSlot[]>(
        `/api/portal/reservas/areas/${areaId}/ocupados`,
        { params: { fromUtc: range.fromUtc, toUtc: range.toUtc } },
      )
      return data
    },
  })

  const selectedArea = areasQuery.data?.find((a) => a.id === areaId) ?? null
  const showAvailability =
    occupiedQuery.data != null && portalReservationsShowsAvailability(occupiedQuery.data)

  const unitSelectData = useMemo(() => {
    const units = homeQuery.data?.units ?? []
    if (units.length > 0) {
      return units.map((u) => ({ value: u.unitId, label: `Unidad ${u.code}` }))
    }
    return []
  }, [homeQuery.data])

  const createMutation = useMutation({
    mutationFn: async () => {
      if (!areaId) throw new Error('Selecciona una zona común.')
      const startsAtUtc = new Date(form.values.startsLocal).toISOString()
      const endsAtUtc = new Date(form.values.endsLocal).toISOString()
      const { data } = await api.post<PortalReservation>('/api/portal/reservas', {
        commonAreaId: areaId,
        unitId: form.values.unitId,
        startsAtUtc,
        endsAtUtc,
        attendeesCount: form.values.attendeesCount,
        notes: form.values.notes.trim() || null,
      })
      return data
    },
    onSuccess: () => {
      notifications.show({ title: 'Reserva creada', message: 'Tu reserva quedó confirmada.', color: 'teal' })
      void queryClient.invalidateQueries({ queryKey: ['portalMyReservations'] })
      void queryClient.invalidateQueries({ queryKey: ['portalOccupiedSlots'] })
    },
    onError: (err) =>
      notifications.show({ title: 'No se pudo reservar', message: getApiErrorMessage(err), color: 'red' }),
  })

  const cancelMutation = useMutation({
    mutationFn: async (id: string) => {
      await api.post(`/api/portal/reservas/${id}/cancel`)
    },
    onSuccess: () => {
      notifications.show({ title: 'Reserva cancelada', message: 'La reserva quedó inactiva.', color: 'gray' })
      void queryClient.invalidateQueries({ queryKey: ['portalMyReservations'] })
      void queryClient.invalidateQueries({ queryKey: ['portalOccupiedSlots'] })
    },
    onError: (err) =>
      notifications.show({ title: 'Error', message: getApiErrorMessage(err), color: 'red' }),
  })

  if (!canBook) {
    return (
      <Alert color="orange" title="Sin permiso">
        No tienes permiso para reservar zonas comunes.
      </Alert>
    )
  }

  if (areasQuery.isLoading || mineQuery.isLoading) {
    return (
      <Stack align="center" py="xl">
        <Loader color="teal" />
      </Stack>
    )
  }

  if (areasQuery.isError) {
    return (
      <Alert color="red" title="No se pudieron cargar las zonas">
        {getApiErrorMessage(areasQuery.error)}
      </Alert>
    )
  }

  const areas = areasQuery.data ?? []

  return (
    <Stack gap="lg">
      <Group justify="space-between" align="flex-start">
        <Stack gap={4}>
          <Title order={2} style={{ fontFamily: 'Fraunces, Georgia, serif' }}>
            Reservas
          </Title>
          <Text c="dimmed" size="sm">
            Reserva zonas comunes con tu unidad vinculada
          </Text>
        </Stack>
        <Button component={Link} to="/portal" variant="default" size="sm">
          Inicio
        </Button>
      </Group>

      {areas.length === 0 ? (
        <Alert color="yellow" title="Sin zonas">
          La administración aún no ha publicado zonas comunes reservables.
        </Alert>
      ) : (
        <form
          onSubmit={form.onSubmit(() => {
            if (!areaId) {
              notifications.show({
                title: 'Zona requerida',
                message: 'Selecciona una zona común.',
                color: 'orange',
              })
              return
            }
            createMutation.mutate()
          })}
        >
          <Stack gap="sm">
            <Select
              label="Zona común"
              required
              searchable
              data={areas.map((a) => ({ value: a.id, label: a.name }))}
              value={areaId}
              onChange={setAreaId}
            />
            {selectedArea?.rulesNotes ? (
              <Text size="sm" c="dimmed">
                {selectedArea.rulesNotes}
              </Text>
            ) : null}
            {selectedArea ? (
              <Text size="xs" c="dimmed">
                Aforo {selectedArea.capacity}
                {selectedArea.minDurationMinutes
                  ? ` · mín. ${selectedArea.minDurationMinutes} min`
                  : ''}
                {selectedArea.maxDurationMinutes
                  ? ` · máx. ${selectedArea.maxDurationMinutes} min`
                  : ''}
              </Text>
            ) : null}

            {areaId && occupiedQuery.isLoading ? <Loader size="sm" /> : null}
            {areaId && showAvailability ? (
              <Stack gap={4}>
                <Text fw={600} size="sm">
                  Ocupados (próximos 14 días)
                </Text>
                {occupiedQuery.data!.length === 0 ? (
                  <Text size="sm" c="dimmed">
                    Sin reservas en ese rango — horario libre.
                  </Text>
                ) : (
                  occupiedQuery.data!.map((slot, i) => (
                    <Text key={`${slot.startsAtUtc}-${i}`} size="sm" c="dimmed">
                      {formatRange(slot.startsAtUtc, slot.endsAtUtc)}
                    </Text>
                  ))
                )}
              </Stack>
            ) : null}

            <Select
              label="Unidad"
              required
              data={unitSelectData}
              {...form.getInputProps('unitId')}
            />
            <Group grow>
              <TextInput
                label="Inicio"
                type="datetime-local"
                required
                {...form.getInputProps('startsLocal')}
              />
              <TextInput
                label="Fin"
                type="datetime-local"
                required
                {...form.getInputProps('endsLocal')}
              />
            </Group>
            <NumberInput
              label="Asistentes"
              min={1}
              {...form.getInputProps('attendeesCount')}
            />
            <Textarea label="Notas" minRows={2} {...form.getInputProps('notes')} />
            <Button type="submit" loading={createMutation.isPending}>
              Reservar
            </Button>
          </Stack>
        </form>
      )}

      <Stack gap="sm">
        <Text fw={600} size="sm">
          Mis reservas
        </Text>
        {(mineQuery.data ?? []).length === 0 ? (
          <Text size="sm" c="dimmed">
            Aún no tienes reservas activas.
          </Text>
        ) : (
          (mineQuery.data ?? []).map((r) => (
            <div key={r.id} className="portal-unit-card">
              <Group justify="space-between" align="flex-start" wrap="nowrap">
                <Stack gap={2}>
                  <Text fw={600} size="sm">
                    {r.commonAreaName}
                  </Text>
                  <Text size="xs" c="dimmed">
                    Unidad {r.unitCode} · {formatRange(r.startsAtUtc, r.endsAtUtc)}
                  </Text>
                </Stack>
                {r.canCancel ? (
                  <Button
                    size="xs"
                    variant="light"
                    color="red"
                    loading={cancelMutation.isPending}
                    onClick={() => {
                      if (window.confirm('¿Cancelar esta reserva?')) cancelMutation.mutate(r.id)
                    }}
                  >
                    Cancelar
                  </Button>
                ) : null}
              </Group>
            </div>
          ))
        )}
      </Stack>
    </Stack>
  )
}
