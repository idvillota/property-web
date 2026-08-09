import { Group, SimpleGrid, Stack, Table, Text, TextInput, Title } from '@mantine/core'
import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import { api } from '../../../api/client'
import { getApiErrorMessage } from '../../../api/errors'
import type { ReservationUsageReport } from '../../../api/types'
import { usePropertyId } from '../../../hooks/usePropertyId'
import { labelForOption, RESERVATION_STATUS_OPTIONS } from '../../../lib/amenitiesEnums'
import { ReportPageShell } from '../components/ReportPageShell'
import { daysAgoIsoDate, formatDateTime, todayIsoDate } from '../lib/reportDates'

export function ReservationUsageReportPage() {
  const propertyId = usePropertyId()
  const [from, setFrom] = useState(daysAgoIsoDate(30))
  const [to, setTo] = useState(todayIsoDate())

  const query = useQuery({
    queryKey: ['reports-reservation-usage', propertyId, from, to],
    queryFn: async () => {
      const params = new URLSearchParams({
        horizontalPropertyId: propertyId,
        from,
        to,
      })
      const { data } = await api.get<ReservationUsageReport>(
        `/api/Reports/reservation-usage?${params}`,
      )
      return data
    },
    enabled: Boolean(from && to),
  })

  const report = query.data

  return (
    <ReportPageShell
      title="Uso de reservas"
      description="Reservas de zonas comunes en el periodo seleccionado."
      filters={
        <Group>
          <TextInput
            type="date"
            label="Desde"
            value={from}
            onChange={(e) => setFrom(e.currentTarget.value)}
            w={180}
          />
          <TextInput
            type="date"
            label="Hasta"
            value={to}
            onChange={(e) => setTo(e.currentTarget.value)}
            w={180}
          />
        </Group>
      }
      loading={query.isLoading}
      error={query.isError ? getApiErrorMessage(query.error) : null}
    >
      {report ? (
        <Stack gap="lg">
          <SimpleGrid cols={{ base: 2, sm: 4 }} spacing="md">
            <Kpi label="Reservas" value={String(report.totals.reservationCount)} />
            <Kpi label="Confirmadas" value={String(report.totals.confirmedCount)} />
            <Kpi label="Canceladas" value={String(report.totals.cancelledCount)} />
            <Kpi label="Completadas" value={String(report.totals.completedCount)} />
          </SimpleGrid>

          <Stack gap="xs">
            <Text fw={600} size="sm">
              Por zona
            </Text>
            <Table striped withTableBorder>
              <Table.Thead>
                <Table.Tr>
                  <Table.Th>Zona común</Table.Th>
                  <Table.Th ta="right">Cantidad</Table.Th>
                  <Table.Th ta="right">Confirmadas</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {report.byArea.length === 0 ? (
                  <EmptyRow cols={3} />
                ) : (
                  report.byArea.map((row) => (
                    <Table.Tr key={row.commonAreaId}>
                      <Table.Td>{row.commonAreaName}</Table.Td>
                      <Table.Td ta="right">{row.count}</Table.Td>
                      <Table.Td ta="right">{row.confirmedCount}</Table.Td>
                    </Table.Tr>
                  ))
                )}
              </Table.Tbody>
            </Table>
          </Stack>

          <Stack gap="xs">
            <Text fw={600} size="sm">
              Reservas recientes
            </Text>
            <Table striped highlightOnHover withTableBorder>
              <Table.Thead>
                <Table.Tr>
                  <Table.Th>Zona</Table.Th>
                  <Table.Th>Unidad</Table.Th>
                  <Table.Th>Inicia</Table.Th>
                  <Table.Th>Termina</Table.Th>
                  <Table.Th>Estado</Table.Th>
                  <Table.Th ta="right">Asistentes</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {report.items.length === 0 ? (
                  <EmptyRow cols={6} />
                ) : (
                  report.items.map((row) => (
                    <Table.Tr key={row.reservationId}>
                      <Table.Td>{row.commonAreaName}</Table.Td>
                      <Table.Td>{row.unitCode}</Table.Td>
                      <Table.Td>{formatDateTime(row.startsAtUtc)}</Table.Td>
                      <Table.Td>{formatDateTime(row.endsAtUtc)}</Table.Td>
                      <Table.Td>
                        {labelForOption(RESERVATION_STATUS_OPTIONS, row.status)}
                      </Table.Td>
                      <Table.Td ta="right">{row.attendeesCount}</Table.Td>
                    </Table.Tr>
                  ))
                )}
              </Table.Tbody>
            </Table>
          </Stack>
        </Stack>
      ) : null}
    </ReportPageShell>
  )
}

function Kpi({ label, value }: { label: string; value: string }) {
  return (
    <Stack gap={2}>
      <Text size="xs" c="dimmed" tt="uppercase">
        {label}
      </Text>
      <Title order={4}>{value}</Title>
    </Stack>
  )
}

function EmptyRow({ cols }: { cols: number }) {
  return (
    <Table.Tr>
      <Table.Td colSpan={cols}>
        <Text c="dimmed" size="sm">
          Sin datos.
        </Text>
      </Table.Td>
    </Table.Tr>
  )
}
