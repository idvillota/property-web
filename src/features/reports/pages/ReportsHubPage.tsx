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
    description: 'Units in arrears and outstanding balances',
    icon: IconCash,
  },
  {
    to: 'collections',
    label: 'Collections',
    description: 'Payments collected in a date range',
    icon: IconChartBar,
  },
  {
    to: 'occupancy',
    label: 'Occupancy',
    description: 'Owners, residents, and vacant units',
    icon: IconUsersGroup,
  },
  {
    to: 'coefficients',
    label: 'Coefficients',
    description: 'Coefficient distribution toward 100',
    icon: IconPercentage,
  },
  {
    to: 'reservations',
    label: 'Reservation usage',
    description: 'Common area bookings over time',
    icon: IconCalendarCheck,
  },
  {
    to: 'reception',
    label: 'Reception',
    description: 'Packages, letters, and deliveries',
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
        title="Reports"
        description="Read-only snapshots for billing, occupancy, amenities, and reception."
      />

      {overviewQuery.isLoading ? <Loader size="sm" /> : null}
      {overviewQuery.isError ? (
        <Alert color="red" title="Could not load overview">
          {getApiErrorMessage(overviewQuery.error)}
        </Alert>
      ) : null}

      {overview ? (
        <SimpleGrid cols={{ base: 2, sm: 3, md: 5 }} spacing="md">
          <Kpi label="Units" value={String(overview.unitCount)} />
          <Kpi label="Billable units" value={String(overview.billableUnitCount)} />
          <Kpi label="Active occupancies" value={String(overview.activeOccupancyCount)} />
          <Kpi label="Total coefficient" value={overview.totalCoefficient.toFixed(5)} />
          <Kpi
            label="Remaining to 100"
            value={overview.remainingCoefficientToHundred.toFixed(5)}
            accent={overview.remainingCoefficientToHundred !== 0 ? 'orange' : 'teal'}
          />
          <Kpi label="Open charges" value={formatMoney(overview.openChargesAmount)} />
          <Kpi label="Overdue charges" value={formatMoney(overview.overdueChargesAmount)} />
          <Kpi label="Collected this month" value={formatMoney(overview.collectedAmountThisMonth)} />
          <Kpi label="Pending reception" value={String(overview.pendingReceptionCount)} />
          <Kpi label="Upcoming reservations" value={String(overview.upcomingReservationsCount)} />
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
