import { Alert, Anchor, Group, Loader, SimpleGrid, Stack, Text, ThemeIcon, Title } from '@mantine/core'
import {
  IconCalendarCheck,
  IconCash,
  IconChartBar,
  IconPackage,
  IconPercentage,
  IconUsersGroup,
} from '@tabler/icons-react'
import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { api } from '../../../api/client'
import { getApiErrorMessage } from '../../../api/errors'
import type { ReportsOverview } from '../../../api/types'
import { PageHeader } from '../../../components/shared/PageHeader'
import { usePropertyId } from '../../../hooks/usePropertyId'
import { formatMoney } from '../../../lib/money'

const REPORT_LINKS = [
  {
    to: 'cartera',
    label: 'Cartera',
    description: 'Unidades en mora y saldos pendientes',
    icon: IconCash,
  },
  {
    to: 'collections',
    label: 'Recaudos',
    description: 'Pagos recaudados en un rango de fechas',
    icon: IconChartBar,
  },
  {
    to: 'occupancy',
    label: 'Ocupación',
    description: 'Propietarios, residentes y unidades vacantes',
    icon: IconUsersGroup,
  },
  {
    to: 'coefficients',
    label: 'Coeficientes',
    description: 'Distribución de coeficientes hacia 100',
    icon: IconPercentage,
  },
  {
    to: 'reservations',
    label: 'Uso de reservas',
    description: 'Reservas de zonas comunes en el tiempo',
    icon: IconCalendarCheck,
  },
  {
    to: 'reception',
    label: 'Portería',
    description: 'Paquetes, cartas y entregas',
    icon: IconPackage,
  },
] as const

export function ReportsHubPage() {
  const propertyId = usePropertyId()

  const overviewQuery = useQuery({
    queryKey: ['reports-overview', propertyId],
    queryFn: async () => {
      const { data } = await api.get<ReportsOverview>(
        `/api/Reports/overview?horizontalPropertyId=${encodeURIComponent(propertyId)}`,
      )
      return data
    },
  })

  const overview = overviewQuery.data

  return (
    <Stack gap="lg">
      <PageHeader
        title="Reportes"
        description="Consultas de solo lectura sobre facturación, ocupación, zonas comunes y portería."
      />

      {overviewQuery.isLoading ? <Loader size="sm" /> : null}
      {overviewQuery.isError ? (
        <Alert color="red" title="No se pudo cargar el resumen">
          {getApiErrorMessage(overviewQuery.error)}
        </Alert>
      ) : null}

      {overview ? (
        <SimpleGrid cols={{ base: 2, sm: 3, md: 5 }} spacing="md">
          <Kpi label="Unidades" value={String(overview.unitCount)} />
          <Kpi label="Unidades facturables" value={String(overview.billableUnitCount)} />
          <Kpi label="Ocupaciones activas" value={String(overview.activeOccupancyCount)} />
          <Kpi label="Coeficiente total" value={overview.totalCoefficient.toFixed(2)} />
          <Kpi
            label="Restante para 100"
            value={overview.remainingCoefficientToHundred.toFixed(2)}
            accent={overview.remainingCoefficientToHundred !== 0 ? 'orange' : 'teal'}
          />
          <Kpi label="Cargos abiertos" value={formatMoney(overview.openChargesAmount)} />
          <Kpi label="Cargos vencidos" value={formatMoney(overview.overdueChargesAmount)} />
          <Kpi label="Recaudado este mes" value={formatMoney(overview.collectedAmountThisMonth)} />
          <Kpi label="Pendientes en portería" value={String(overview.pendingReceptionCount)} />
          <Kpi label="Reservas próximas" value={String(overview.upcomingReservationsCount)} />
        </SimpleGrid>
      ) : null}

      <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="md">
        {REPORT_LINKS.map((item) => (
          <Anchor
            key={item.to}
            component={Link}
            to={`/properties/${propertyId}/reports/${item.to}`}
            underline="never"
            c="inherit"
          >
            <Group gap="sm" align="flex-start" wrap="nowrap">
              <ThemeIcon variant="light" size="lg" radius="md">
                <item.icon size={18} stroke={1.75} />
              </ThemeIcon>
              <Stack gap={2}>
                <Text fw={600} size="sm">
                  {item.label}
                </Text>
                <Text size="xs" c="dimmed">
                  {item.description}
                </Text>
              </Stack>
            </Group>
          </Anchor>
        ))}
      </SimpleGrid>
    </Stack>
  )
}

function Kpi({
  label,
  value,
  accent,
}: {
  label: string
  value: string
  accent?: string
}) {
  return (
    <Stack gap={2}>
      <Text size="xs" c="dimmed" tt="uppercase">
        {label}
      </Text>
      <Title order={4} c={accent}>
        {value}
      </Title>
    </Stack>
  )
}
