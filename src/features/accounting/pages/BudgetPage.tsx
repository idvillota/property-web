import { Loader, NumberInput, Stack, Table, Text } from '@mantine/core'
import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import { api } from '../../../api/client'
import { getApiErrorMessage } from '../../../api/errors'
import { PageHeader } from '../../../components/shared/PageHeader'
import { usePropertyId } from '../../../hooks/usePropertyId'
import { formatMoney } from '../../../lib/money'
import { BudgetPage_ShowsVariance } from '../lib/budgetPageShowsVariance'

type Row = {
  accountCode: string
  accountName: string
  month: number
  budgetAmount: number
  executedAmount: number
  variance: number
}

export function BudgetPage() {
  const propertyId = usePropertyId()
  const [year, setYear] = useState(new Date().getFullYear())
  const query = useQuery({
    queryKey: ['accounting-budget-exec', propertyId, year],
    queryFn: async () => {
      const { data } = await api.get<Row[]>(
        `/api/accounting/budgets/execution?horizontalPropertyId=${encodeURIComponent(propertyId)}&year=${year}`,
      )
      return data
    },
  })
  const rows = query.data ?? []
  const show = BudgetPage_ShowsVariance(rows)

  return (
    <Stack gap="md">
      <PageHeader title="Presupuesto y ejecución" description="Variación presupuesto vs asientos del período." />
      <NumberInput label="Año" value={year} onChange={(v) => setYear(Number(v) || year)} w={140} />
      {query.isLoading ? <Loader size="sm" /> : null}
      {query.isError ? <Text c="red">{getApiErrorMessage(query.error)}</Text> : null}
      {show ? (
        <Table striped>
          <Table.Thead>
            <Table.Tr>
              <Table.Th>Cuenta</Table.Th>
              <Table.Th>Mes</Table.Th>
              <Table.Th>Presupuesto</Table.Th>
              <Table.Th>Ejecutado</Table.Th>
              <Table.Th>Variación</Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {rows.map((r, i) => (
              <Table.Tr key={`${r.accountCode}-${r.month}-${i}`}>
                <Table.Td>
                  {r.accountCode} — {r.accountName}
                </Table.Td>
                <Table.Td>{r.month}</Table.Td>
                <Table.Td>{formatMoney(r.budgetAmount)}</Table.Td>
                <Table.Td>{formatMoney(r.executedAmount)}</Table.Td>
                <Table.Td>{formatMoney(r.variance)}</Table.Td>
              </Table.Tr>
            ))}
          </Table.Tbody>
        </Table>
      ) : (
        <Text c="dimmed">Sin líneas de presupuesto para el año.</Text>
      )}
    </Stack>
  )
}
