import { SimpleGrid, Stack, Table, Text, Title } from '@mantine/core'
import { useQuery } from '@tanstack/react-query'
import { api } from '../../../api/client'
import { getApiErrorMessage } from '../../../api/errors'
import type { CoefficientsReport } from '../../../api/types'
import { usePropertyId } from '../../../hooks/usePropertyId'
import { labelForOption, UNIT_TYPE_OPTIONS } from '../../../lib/structureEnums'
import { ReportPageShell } from '../components/ReportPageShell'

export function CoefficientsReportPage() {
  const propertyId = usePropertyId()

  const query = useQuery({
    queryKey: ['reports-coefficients', propertyId],
    queryFn: async () => {
      const { data } = await api.get<CoefficientsReport>(
        `/api/Reports/coefficients?horizontalPropertyId=${encodeURIComponent(propertyId)}`,
      )
      return data
    },
  })

  const report = query.data
  const remainingOff = (report?.totals.remainingToHundred ?? 0) !== 0

  return (
    <ReportPageShell
      title="Coefficients"
      description="Coefficient distribution across units (scale 100)."
      loading={query.isLoading}
      error={query.isError ? getApiErrorMessage(query.error) : null}
    >
      {report ? (
        <Stack gap="md">
          <SimpleGrid cols={{ base: 2, sm: 4 }} spacing="md">
            <Kpi label="Units" value={String(report.totals.unitCount)} />
            <Kpi label="Billable units" value={String(report.totals.billableUnitCount)} />
            <Kpi label="Total coefficient" value={report.totals.totalCoefficient.toFixed(5)} />
            <Kpi
              label="Remaining to 100"
              value={report.totals.remainingToHundred.toFixed(5)}
              accent={remainingOff ? 'orange' : 'teal'}
            />
          </SimpleGrid>

          {remainingOff ? (
            <Text size="sm" c="orange">
              Coefficients do not sum to 100. Remaining:{' '}
              {report.totals.remainingToHundred.toFixed(5)}
            </Text>
          ) : null}

          <Table striped highlightOnHover withTableBorder>
            <Table.Thead>
              <Table.Tr>
                <Table.Th>Unit</Table.Th>
                <Table.Th>Type</Table.Th>
                <Table.Th ta="right">Coefficient</Table.Th>
                <Table.Th ta="right">Built area m²</Table.Th>
                <Table.Th>Billable</Table.Th>
                <Table.Th>Active</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {report.items.length === 0 ? (
                <Table.Tr>
                  <Table.Td colSpan={6}>
                    <Text c="dimmed" size="sm">
                      No units.
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
                    <Table.Td ta="right">{row.coefficient.toFixed(5)}</Table.Td>
                    <Table.Td ta="right">{row.privateBuiltAreaM2.toFixed(2)}</Table.Td>
                    <Table.Td>{row.isBillable ? 'Yes' : 'No'}</Table.Td>
                    <Table.Td>{row.isActive ? 'Yes' : 'No'}</Table.Td>
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
