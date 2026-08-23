import {
  Alert,
  Card,
  Group,
  Loader,
  SimpleGrid,
  Stack,
  Text,
  Title,
} from '@mantine/core'
import { useQuery } from '@tanstack/react-query'
import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../../../api/client'
import { getApiErrorMessage } from '../../../api/errors'
import type { HoldingSummary, HorizontalProperty } from '../../../api/types'
import { PageHeader } from '../../../components/shared/PageHeader'
import { optionsListQuery, buildListUrl } from '../../../api/paging'
import type { PagedResult } from '../../../api/paging'
import { formatMoney } from '../../../lib/money'
import { PropertySwitcher } from '../components/PropertySwitcher'

function occupancyPct(occupied: number, total: number) {
  if (total <= 0) return '0%'
  return `${Math.round((occupied / total) * 100)}%`
}

export function HoldingPage() {
  const [selectedPropertyId, setSelectedPropertyId] = useState<string | null>(null)

  const propertiesQuery = useQuery({
    queryKey: ['horizontal-properties', 'holding'],
    queryFn: async () => {
      const state = { ...optionsListQuery(), includeInactive: true }
      const { data } = await api.get<PagedResult<HorizontalProperty>>(
        buildListUrl('/api/HorizontalProperties', state),
      )
      return data.items
    },
  })

  const summaryQuery = useQuery({
    queryKey: ['holding-summary'],
    queryFn: async () => {
      const { data } = await api.get<HoldingSummary>('/api/holding/summary')
      return data
    },
  })

  const visibleRows = useMemo(() => {
    const rows = summaryQuery.data?.properties ?? []
    if (!selectedPropertyId) return rows
    return rows.filter((r) => r.propertyId === selectedPropertyId)
  }, [summaryQuery.data?.properties, selectedPropertyId])

  const totals = useMemo(() => {
    const rows = summaryQuery.data?.properties ?? []
    return {
      propertyCount: rows.length,
      openBalance: rows.reduce((sum, r) => sum + r.openBalance, 0),
      overdueBalance: rows.reduce((sum, r) => sum + r.overdueBalance, 0),
    }
  }, [summaryQuery.data?.properties])

  return (
    <Stack gap="lg">
      <PageHeader
        title="Vista holding"
        description="KPIs consolidados por propiedad horizontal autorizada. Seleccione una PH para filtrar sin mezclar datos al entrar a una."
      />

      {propertiesQuery.isLoading ? (
        <Loader size="sm" />
      ) : propertiesQuery.isError ? (
        <Alert color="red">{getApiErrorMessage(propertiesQuery.error)}</Alert>
      ) : (
        <PropertySwitcher
          properties={propertiesQuery.data ?? []}
          value={selectedPropertyId}
          onChange={setSelectedPropertyId}
          includeInactive={false}
        />
      )}

      {summaryQuery.isLoading ? (
        <Group justify="center" py="xl">
          <Loader />
        </Group>
      ) : summaryQuery.isError ? (
        <Alert color="red">{getApiErrorMessage(summaryQuery.error)}</Alert>
      ) : (
        <>
          <SimpleGrid cols={{ base: 1, sm: 3 }} spacing="md">
            <Card withBorder padding="md" radius="md">
              <Text size="xs" c="dimmed" tt="uppercase" fw={600}>
                Propiedades
              </Text>
              <Title order={3}>{totals.propertyCount}</Title>
            </Card>
            <Card withBorder padding="md" radius="md">
              <Text size="xs" c="dimmed" tt="uppercase" fw={600}>
                Cartera abierta
              </Text>
              <Title order={3}>{formatMoney(totals.openBalance)}</Title>
            </Card>
            <Card withBorder padding="md" radius="md">
              <Text size="xs" c="dimmed" tt="uppercase" fw={600}>
                Mora total
              </Text>
              <Title order={3} c="red">
                {formatMoney(totals.overdueBalance)}
              </Title>
            </Card>
          </SimpleGrid>

          {visibleRows.length === 0 ? (
            <Alert color="gray">No hay KPIs para el filtro seleccionado.</Alert>
          ) : (
            <SimpleGrid cols={{ base: 1, md: 2 }} spacing="md">
              {visibleRows.map((row) => (
                <Card key={row.propertyId} withBorder padding="lg" radius="md">
                  <Stack gap="sm">
                    <Group justify="space-between" align="flex-start">
                      <div>
                        <Text fw={600}>{row.name}</Text>
                        <Text size="xs" c="dimmed">
                          {row.totalUnits} unidades · {row.occupiedUnits} ocupadas
                        </Text>
                      </div>
                      <Text size="sm" fw={500}>
                        Ocupación {occupancyPct(row.occupiedUnits, row.totalUnits)}
                      </Text>
                    </Group>
                    <Group grow>
                      <div>
                        <Text size="xs" c="dimmed">
                          Cartera abierta
                        </Text>
                        <Text fw={600}>{formatMoney(row.openBalance)}</Text>
                      </div>
                      <div>
                        <Text size="xs" c="dimmed">
                          En mora
                        </Text>
                        <Text fw={600} c="red">
                          {formatMoney(row.overdueBalance)}
                        </Text>
                      </div>
                    </Group>
                    <Text
                      component={Link}
                      to={`/properties/${row.propertyId}`}
                      size="sm"
                      c="teal"
                    >
                      Entrar a la propiedad →
                    </Text>
                  </Stack>
                </Card>
              ))}
            </SimpleGrid>
          )}
        </>
      )}
    </Stack>
  )
}
