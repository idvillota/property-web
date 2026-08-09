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
      title="Coeficientes"
      description="Distribución de coeficientes entre unidades (escala 100)."
      loading={query.isLoading}
      error={query.isError ? getApiErrorMessage(query.error) : null}
    >
      {report ? (
        <Stack gap="md">
          <SimpleGrid cols={{ base: 2, sm: 4 }} spacing="md">
            <Kpi label="Unidades" value={String(report.totals.unitCount)} />
            <Kpi label="Unidades facturables" value={String(report.totals.billableUnitCount)} />
            <Kpi label="Coeficiente total" value={report.totals.totalCoefficient.toFixed(2)} />
            <Kpi
              label="Restante para 100"
              value={report.totals.remainingToHundred.toFixed(2)}
              accent={remainingOff ? 'orange' : 'teal'}
            />
          </SimpleGrid>

          {remainingOff ? (
            <Text size="sm" c="orange">
              Los coeficientes no suman 100. Restante:{' '}
              {report.totals.remainingToHundred.toFixed(2)}
            </Text>
          ) : null}

          <Table striped highlightOnHover withTableBorder>
            <Table.Thead>
              <Table.Tr>
                <Table.Th>Unidad</Table.Th>
                <Table.Th>Tipo</Table.Th>
                <Table.Th ta="right">Coeficiente</Table.Th>
                <Table.Th ta="right">Área construida m²</Table.Th>
                <Table.Th>Facturable</Table.Th>
                <Table.Th>Activo</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {report.items.length === 0 ? (
                <Table.Tr>
                  <Table.Td colSpan={6}>
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
                    <Table.Td ta="right">{row.coefficient.toFixed(2)}</Table.Td>
                    <Table.Td ta="right">{row.privateBuiltAreaM2.toFixed(2)}</Table.Td>
                    <Table.Td>{row.isBillable ? 'Sí' : 'No'}</Table.Td>
                    <Table.Td>{row.isActive ? 'Sí' : 'No'}</Table.Td>
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
