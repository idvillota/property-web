import {
  Badge,
  Group,
  Loader,
  Paper,
  SimpleGrid,
  Stack,
  Text,
  ThemeIcon,
} from '@mantine/core'
import {
  IconCalendarEvent,
  IconCash,
  IconDoor,
  IconAlertTriangle,
} from '@tabler/icons-react'
import { useQuery } from '@tanstack/react-query'
import { api } from '../../../api/client'
import type { PersonOverview } from '../../../api/types'
import { FormDrawer } from '../../../components/crud/FormDrawer'
import { formatMoney } from '../../../lib/money'
import { PAYMENT_METHOD_OPTIONS } from '../../../lib/billingEnums'
import {
  labelForOption,
  OCCUPANCY_ROLE_OPTIONS,
  UNIT_TYPE_OPTIONS,
} from '../../../lib/structureEnums'

const RESERVATION_STATUS: Record<string, string> = {
  Pending: 'Pendiente',
  Confirmed: 'Confirmada',
  Cancelled: 'Cancelada',
  Completed: 'Completada',
  NoShow: 'No asistió',
  0: 'Pendiente',
  1: 'Confirmada',
  2: 'Cancelada',
  3: 'Completada',
  4: 'No asistió',
}

type Props = {
  personId: string | null
  onClose: () => void
}

export function PersonOverviewDrawer({ personId, onClose }: Props) {
  const overviewQuery = useQuery({
    queryKey: ['person-overview', personId],
    enabled: !!personId,
    queryFn: async () => {
      const { data } = await api.get<PersonOverview>(`/api/People/${personId}/overview`)
      return data
    },
  })

  const overview = overviewQuery.data

  return (
    <FormDrawer
      opened={personId !== null}
      onClose={onClose}
      size="lg"
      title={overview?.fullName ?? 'Persona'}
    >
      {overviewQuery.isLoading ? (
        <Stack align="center" py="xl">
          <Loader />
        </Stack>
      ) : overview ? (
        <Stack gap="lg">
          <Stack gap={4}>
            <Text size="sm" c="dimmed">
              {overview.documentLabel}
            </Text>
            {(overview.email || overview.phone) && (
              <Text size="sm">
                {[overview.phone, overview.email].filter(Boolean).join(' · ')}
              </Text>
            )}
          </Stack>

          <SimpleGrid cols={3} spacing="xs">
            <Paper withBorder p="sm" radius="md">
              <Text size="xs" c="dimmed">
                Saldo abierto
              </Text>
              <Text fw={700} size="sm">
                {formatMoney(overview.paymentStatus.openBalance)}
              </Text>
            </Paper>
            <Paper withBorder p="sm" radius="md">
              <Group gap={4}>
                <IconAlertTriangle size={14} color="var(--mantine-color-orange-6)" />
                <Text size="xs" c="dimmed">
                  Vencido
                </Text>
              </Group>
              <Text fw={700} size="sm" c={overview.paymentStatus.overdueBalance > 0 ? 'orange' : undefined}>
                {formatMoney(overview.paymentStatus.overdueBalance)}
              </Text>
            </Paper>
            <Paper withBorder p="sm" radius="md">
              <Text size="xs" c="dimmed">
                Pagado (90d)
              </Text>
              <Text fw={700} size="sm" c="teal">
                {formatMoney(overview.paymentStatus.paidLast90Days)}
              </Text>
            </Paper>
          </SimpleGrid>

          <Stack gap="xs">
            <Group gap={8}>
              <ThemeIcon variant="light" color="teal" radius="md" size="sm">
                <IconDoor size={14} />
              </ThemeIcon>
              <Text size="xs" tt="uppercase" fw={700} c="dimmed">
                Unidades
              </Text>
            </Group>
            {overview.units.length === 0 ? (
              <Text size="sm" c="dimmed">
                Sin unidades vinculadas.
              </Text>
            ) : (
              overview.units.map((u) => (
                <Paper
                  key={`${u.unitId}-${u.role}`}
                  withBorder
                  p="sm"
                  radius="md"
                  style={{
                    background: 'light-dark(var(--mantine-color-teal-0), var(--mantine-color-dark-6))',
                  }}
                >
                  <Group justify="space-between" align="flex-start" wrap="nowrap">
                    <Stack gap={2}>
                      <Group gap={6}>
                        <Text fw={700} size="sm">
                          {u.unitCode}
                        </Text>
                        <Badge size="xs" variant="light">
                          {labelForOption(UNIT_TYPE_OPTIONS, u.unitType)}
                        </Badge>
                        <Badge size="xs" variant="outline" color="teal">
                          {labelForOption(OCCUPANCY_ROLE_OPTIONS, u.role)}
                        </Badge>
                      </Group>
                      <Text size="xs" c="dimmed">
                        {[u.buildingName, u.floorName].filter(Boolean).join(' · ') || 'Sin bloque/piso'}
                      </Text>
                    </Stack>
                    <Stack gap={0} align="flex-end">
                      <Text size="xs" c="dimmed">
                        Saldo
                      </Text>
                      <Text size="sm" fw={600} c={u.overdueBalance > 0 ? 'orange' : undefined}>
                        {formatMoney(u.openBalance)}
                      </Text>
                    </Stack>
                  </Group>
                </Paper>
              ))
            )}
          </Stack>

          <Stack gap="xs">
            <Group gap={8}>
              <ThemeIcon variant="light" color="blue" radius="md" size="sm">
                <IconCash size={14} />
              </ThemeIcon>
              <Text size="xs" tt="uppercase" fw={700} c="dimmed">
                Pagos recientes
              </Text>
            </Group>
            {overview.paymentStatus.recentPayments.length === 0 ? (
              <Text size="sm" c="dimmed">
                Sin pagos registrados a nombre de esta persona.
              </Text>
            ) : (
              overview.paymentStatus.recentPayments.map((p) => (
                <Group key={p.paymentId} justify="space-between" wrap="nowrap">
                  <Stack gap={0}>
                    <Text size="sm" fw={500}>
                      {p.unitCode}
                    </Text>
                    <Text size="xs" c="dimmed">
                      {new Date(p.paidAt).toLocaleDateString('es-CO')} ·{' '}
                      {labelForOption(PAYMENT_METHOD_OPTIONS, String(p.method))}
                    </Text>
                  </Stack>
                  <Text size="sm" fw={600}>
                    {formatMoney(p.amount)}
                  </Text>
                </Group>
              ))
            )}
          </Stack>

          <Stack gap="xs">
            <Group gap={8}>
              <ThemeIcon variant="light" color="violet" radius="md" size="sm">
                <IconCalendarEvent size={14} />
              </ThemeIcon>
              <Text size="xs" tt="uppercase" fw={700} c="dimmed">
                Reservas
              </Text>
            </Group>
            {overview.reservations.length === 0 ? (
              <Text size="sm" c="dimmed">
                Sin reservas.
              </Text>
            ) : (
              overview.reservations.map((r) => (
                <Paper key={r.reservationId} withBorder p="sm" radius="md">
                  <Group justify="space-between" align="flex-start">
                    <Stack gap={2}>
                      <Text size="sm" fw={600}>
                        {r.commonAreaName}
                      </Text>
                      <Text size="xs" c="dimmed">
                        Unidad {r.unitCode} ·{' '}
                        {new Date(r.startsAtUtc).toLocaleString('es-CO', {
                          dateStyle: 'medium',
                          timeStyle: 'short',
                        })}
                      </Text>
                    </Stack>
                    <Badge size="sm" variant="light">
                      {RESERVATION_STATUS[String(r.status)] ?? String(r.status)}
                    </Badge>
                  </Group>
                </Paper>
              ))
            )}
          </Stack>
        </Stack>
      ) : (
        <Text size="sm" c="dimmed">
          No se pudo cargar el resumen.
        </Text>
      )}
    </FormDrawer>
  )
}
