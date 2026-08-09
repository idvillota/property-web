import { Group, SimpleGrid, Stack, Table, Text, TextInput, Title } from '@mantine/core'
import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import { api } from '../../../api/client'
import { getApiErrorMessage } from '../../../api/errors'
import type { CollectionsReport } from '../../../api/types'
import { usePropertyId } from '../../../hooks/usePropertyId'
import { labelForOption, PAYMENT_METHOD_OPTIONS } from '../../../lib/billingEnums'
import { formatMoney } from '../../../lib/money'
import { ReportPageShell } from '../components/ReportPageShell'
import {
  firstOfMonthIsoDate,
  formatDateTime,
  formatShortDate,
  todayIsoDate,
} from '../lib/reportDates'

export function CollectionsReportPage() {
  const propertyId = usePropertyId()
  const [from, setFrom] = useState(firstOfMonthIsoDate())
  const [to, setTo] = useState(todayIsoDate())

  const query = useQuery({
    queryKey: ['reports-collections', propertyId, from, to],
    queryFn: async () => {
      const params = new URLSearchParams({
        horizontalPropertyId: propertyId,
        from,
        to,
      })
      const { data } = await api.get<CollectionsReport>(`/api/Reports/collections?${params}`)
      return data
    },
    enabled: Boolean(from && to),
  })

  const report = query.data

  return (
    <ReportPageShell
      title="Recaudos"
      description="Pagos recaudados en el periodo seleccionado."
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
          <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="md">
            <Kpi label="Pagos" value={String(report.totals.paymentCount)} />
            <Kpi label="Valor total" value={formatMoney(report.totals.totalAmount)} />
          </SimpleGrid>

          <Stack gap="xs">
            <Text fw={600} size="sm">
              Por método
            </Text>
            <Table striped withTableBorder>
              <Table.Thead>
                <Table.Tr>
                  <Table.Th>Método</Table.Th>
                  <Table.Th ta="right">Cantidad</Table.Th>
                  <Table.Th ta="right">Valor</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {report.byMethod.length === 0 ? (
                  <EmptyRow cols={3} />
                ) : (
                  report.byMethod.map((row) => (
                    <Table.Tr key={String(row.method)}>
                      <Table.Td>{labelForOption(PAYMENT_METHOD_OPTIONS, row.method)}</Table.Td>
                      <Table.Td ta="right">{row.count}</Table.Td>
                      <Table.Td ta="right">{formatMoney(row.amount)}</Table.Td>
                    </Table.Tr>
                  ))
                )}
              </Table.Tbody>
            </Table>
          </Stack>

          <Stack gap="xs">
            <Text fw={600} size="sm">
              Por día
            </Text>
            <Table striped withTableBorder>
              <Table.Thead>
                <Table.Tr>
                  <Table.Th>Fecha</Table.Th>
                  <Table.Th ta="right">Cantidad</Table.Th>
                  <Table.Th ta="right">Valor</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {report.byDay.length === 0 ? (
                  <EmptyRow cols={3} />
                ) : (
                  report.byDay.map((row) => (
                    <Table.Tr key={row.date}>
                      <Table.Td>{formatShortDate(row.date)}</Table.Td>
                      <Table.Td ta="right">{row.count}</Table.Td>
                      <Table.Td ta="right">{formatMoney(row.amount)}</Table.Td>
                    </Table.Tr>
                  ))
                )}
              </Table.Tbody>
            </Table>
          </Stack>

          <Stack gap="xs">
            <Text fw={600} size="sm">
              Pagos recientes
            </Text>
            <Table striped highlightOnHover withTableBorder>
              <Table.Thead>
                <Table.Tr>
                  <Table.Th>Unidad</Table.Th>
                  <Table.Th ta="right">Valor</Table.Th>
                  <Table.Th>Pagado el</Table.Th>
                  <Table.Th>Método</Table.Th>
                  <Table.Th>Referencia</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {report.items.length === 0 ? (
                  <EmptyRow cols={5} />
                ) : (
                  report.items.map((row) => (
                    <Table.Tr key={row.paymentId}>
                      <Table.Td>{row.unitCode}</Table.Td>
                      <Table.Td ta="right">{formatMoney(row.amount)}</Table.Td>
                      <Table.Td>{formatDateTime(row.paidAt)}</Table.Td>
                      <Table.Td>{labelForOption(PAYMENT_METHOD_OPTIONS, row.method)}</Table.Td>
                      <Table.Td>{row.reference || '—'}</Table.Td>
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
