import { Group, SimpleGrid, Stack, Table, Text, TextInput, Title } from '@mantine/core'
import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import { api } from '../../../api/client'
import { getApiErrorMessage } from '../../../api/errors'
import type { ReceptionReport } from '../../../api/types'
import { usePropertyId } from '../../../hooks/usePropertyId'
import {
  labelForOption,
  RECEPTION_ITEM_STATUS_OPTIONS,
  RECEPTION_ITEM_TYPE_OPTIONS,
} from '../../../lib/receptionEnums'
import { ReportPageShell } from '../components/ReportPageShell'
import { daysAgoIsoDate, formatDateTime, todayIsoDate } from '../lib/reportDates'

export function ReceptionReportPage() {
  const propertyId = usePropertyId()
  const [from, setFrom] = useState(daysAgoIsoDate(30))
  const [to, setTo] = useState(todayIsoDate())

  const query = useQuery({
    queryKey: ['reports-reception', propertyId, from, to],
    queryFn: async () => {
      const params = new URLSearchParams({
        horizontalPropertyId: propertyId,
        from,
        to,
      })
      const { data } = await api.get<ReceptionReport>(`/api/Reports/reception?${params}`)
      return data
    },
    enabled: Boolean(from && to),
  })

  const report = query.data

  return (
    <ReportPageShell
      title="Portería"
      description="Paquetes, cartas y mensajes recibidos en el periodo seleccionado."
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
            <Kpi label="Total" value={String(report.totals.total)} />
            <Kpi label="Pendiente de retiro" value={String(report.totals.pendingPickup)} />
            <Kpi label="Entregados" value={String(report.totals.delivered)} />
            <Kpi label="Devueltos" value={String(report.totals.returned)} />
          </SimpleGrid>

          <Stack gap="xs">
            <Text fw={600} size="sm">
              Por tipo
            </Text>
            <Table striped withTableBorder>
              <Table.Thead>
                <Table.Tr>
                  <Table.Th>Tipo</Table.Th>
                  <Table.Th ta="right">Cantidad</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {report.byType.length === 0 ? (
                  <EmptyRow cols={2} />
                ) : (
                  report.byType.map((row) => (
                    <Table.Tr key={String(row.itemType)}>
                      <Table.Td>
                        {labelForOption(RECEPTION_ITEM_TYPE_OPTIONS, row.itemType)}
                      </Table.Td>
                      <Table.Td ta="right">{row.count}</Table.Td>
                    </Table.Tr>
                  ))
                )}
              </Table.Tbody>
            </Table>
          </Stack>

          <Stack gap="xs">
            <Text fw={600} size="sm">
              Ítems recientes
            </Text>
            <Table striped highlightOnHover withTableBorder>
              <Table.Thead>
                <Table.Tr>
                  <Table.Th>Tipo</Table.Th>
                  <Table.Th>Unidad</Table.Th>
                  <Table.Th>Destinatario</Table.Th>
                  <Table.Th>Estado</Table.Th>
                  <Table.Th>Recibido</Table.Th>
                  <Table.Th>Entregado</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {report.items.length === 0 ? (
                  <EmptyRow cols={6} />
                ) : (
                  report.items.map((row) => (
                    <Table.Tr key={row.id}>
                      <Table.Td>
                        {labelForOption(RECEPTION_ITEM_TYPE_OPTIONS, row.itemType)}
                      </Table.Td>
                      <Table.Td>{row.unitCode || '—'}</Table.Td>
                      <Table.Td>{row.recipientName || '—'}</Table.Td>
                      <Table.Td>
                        {labelForOption(RECEPTION_ITEM_STATUS_OPTIONS, row.status)}
                      </Table.Td>
                      <Table.Td>{formatDateTime(row.receivedAtUtc)}</Table.Td>
                      <Table.Td>{formatDateTime(row.deliveredAtUtc)}</Table.Td>
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
