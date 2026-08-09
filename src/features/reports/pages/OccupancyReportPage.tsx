import { SimpleGrid, Stack, Table, Text, Title } from '@mantine/core'
import { useQuery } from '@tanstack/react-query'
import { api } from '../../../api/client'
import { getApiErrorMessage } from '../../../api/errors'
import type { OccupancyReport } from '../../../api/types'
import { usePropertyId } from '../../../hooks/usePropertyId'
import { labelForOption, UNIT_TYPE_OPTIONS } from '../../../lib/structureEnums'
import { ReportPageShell } from '../components/ReportPageShell'

export function OccupancyReportPage() {
  const propertyId = usePropertyId()

  const query = useQuery({
    queryKey: ['reports-occupancy', propertyId],
    queryFn: async () => {
      const { data } = await api.get<OccupancyReport>(
        `/api/Reports/occupancy?horizontalPropertyId=${encodeURIComponent(propertyId)}`,
      )
      return data
    },
  })

  const report = query.data

  return (
    <ReportPageShell
      title="Ocupación"
      description="Propietarios, residentes y unidades vacantes."
      loading={query.isLoading}
      error={query.isError ? getApiErrorMessage(query.error) : null}
    >
      {report ? (
        <Stack gap="md">
          <SimpleGrid cols={{ base: 2, sm: 4 }} spacing="md">
            <Kpi label="Unidades" value={String(report.totals.unitCount)} />
            <Kpi label="Con propietario" value={String(report.totals.unitsWithOwner)} />
            <Kpi label="Con residente" value={String(report.totals.unitsWithResident)} />
            <Kpi label="Vacantes" value={String(report.totals.unitsVacant)} />
          </SimpleGrid>

          <Table striped highlightOnHover withTableBorder>
            <Table.Thead>
              <Table.Tr>
                <Table.Th>Unidad</Table.Th>
                <Table.Th>Tipo</Table.Th>
                <Table.Th>Facturable</Table.Th>
                <Table.Th>Propietario</Table.Th>
                <Table.Th>Residente</Table.Th>
                <Table.Th ta="right">Ocupaciones</Table.Th>
                <Table.Th>Contacto de facturación</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {report.items.length === 0 ? (
                <Table.Tr>
                  <Table.Td colSpan={7}>
                    <Text c="dimmed" size="sm">
                      No hay unidades.
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
                    <Table.Td>{row.isBillable ? 'Sí' : 'No'}</Table.Td>
                    <Table.Td>{row.ownerName || '—'}</Table.Td>
                    <Table.Td>{row.residentName || '—'}</Table.Td>
                    <Table.Td ta="right">{row.occupancyCount}</Table.Td>
                    <Table.Td>{row.hasBillingContact ? 'Sí' : 'No'}</Table.Td>
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
