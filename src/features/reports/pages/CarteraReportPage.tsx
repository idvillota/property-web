import { Group, SimpleGrid, Stack, Table, Text, TextInput, Title } from '@mantine/core'
import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import { api } from '../../../api/client'
import { getApiErrorMessage } from '../../../api/errors'
import type { CarteraReport } from '../../../api/types'
import { usePropertyId } from '../../../hooks/usePropertyId'
import { formatMoney } from '../../../lib/money'
import { labelForOption, UNIT_TYPE_OPTIONS } from '../../../lib/structureEnums'
import { ReportPageShell } from '../components/ReportPageShell'
import { formatShortDate, todayIsoDate } from '../lib/reportDates'

export function CarteraReportPage() {
  const propertyId = usePropertyId()
  const [asOfDate, setAsOfDate] = useState(todayIsoDate())

  const query = useQuery({
    queryKey: ['reports-cartera', propertyId, asOfDate],
    queryFn: async () => {
      const params = new URLSearchParams({ horizontalPropertyId: propertyId })
      if (asOfDate) params.set('asOfDate', asOfDate)
      const { data } = await api.get<CarteraReport>(`/api/Reports/cartera?${params}`)
      return data
    },
  })

  const report = query.data

  return (
    <ReportPageShell
      title="Cartera"
      description="Saldos pendientes por unidad a una fecha."
      filters={
        <Group>
          <TextInput
            type="date"
            label="Fecha de corte"
            value={asOfDate}
            onChange={(e) => setAsOfDate(e.currentTarget.value)}
            w={200}
          />
        </Group>
      }
      loading={query.isLoading}
      error={query.isError ? getApiErrorMessage(query.error) : null}
    >
      {report ? (
        <Stack gap="md">
          <SimpleGrid cols={{ base: 1, sm: 3 }} spacing="md">
            <Kpi label="Unidades en mora" value={String(report.totals.unitCount)} />
            <Kpi label="Saldo total" value={formatMoney(report.totals.totalBalance)} />
            <Kpi label="Total vencido" value={formatMoney(report.totals.totalOverdue)} />
          </SimpleGrid>

          <Table striped highlightOnHover withTableBorder>
            <Table.Thead>
              <Table.Tr>
                <Table.Th>Unidad</Table.Th>
                <Table.Th>Tipo</Table.Th>
                <Table.Th ta="right">Saldo</Table.Th>
                <Table.Th ta="right">Vencido</Table.Th>
                <Table.Th>Vencimiento más antiguo</Table.Th>
                <Table.Th ta="right">Cargos</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {report.items.length === 0 ? (
                <Table.Tr>
                  <Table.Td colSpan={6}>
                    <Text c="dimmed" size="sm">
                      No hay unidades en mora.
                    </Text>
                  </Table.Td>
                </Table.Tr>
              ) : (
                report.items.map((row) => (
                  <Table.Tr key={row.unitId}>
                    <Table.Td>{row.unitCode}</Table.Td>
                    <Table.Td>
                      {labelForOption(UNIT_TYPE_OPTIONS, String(row.unitType))}
                    </Table.Td>
                    <Table.Td ta="right">{formatMoney(row.balance)}</Table.Td>
                    <Table.Td ta="right">{formatMoney(row.overdueBalance)}</Table.Td>
                    <Table.Td>{formatShortDate(row.oldestDueDate)}</Table.Td>
                    <Table.Td ta="right">{row.chargeCount}</Table.Td>
                  </Table.Tr>
                ))
              )}
            </Table.Tbody>
          </Table>
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
