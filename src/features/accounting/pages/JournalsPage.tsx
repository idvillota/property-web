import { Loader, Select, Stack, Table, Text } from '@mantine/core'
import { useQuery } from '@tanstack/react-query'
import { useMemo, useState } from 'react'
import { api } from '../../../api/client'
import { getApiErrorMessage } from '../../../api/errors'
import { PageHeader } from '../../../components/shared/PageHeader'
import { usePropertyId } from '../../../hooks/usePropertyId'
import { formatMoney } from '../../../lib/money'
import { JournalList_FilterBySource } from '../lib/journalListFilterBySource'

type JournalEntry = {
  id: string
  entryDate: string
  sourceType: number
  description: string
  totalDebit: number
  totalCredit: number
}

const SOURCE_OPTIONS = [
  { value: '', label: 'Todos' },
  { value: '1', label: 'Cargos' },
  { value: '2', label: 'Pagos' },
  { value: '3', label: 'CxP factura' },
  { value: '4', label: 'CxP pago' },
  { value: '5', label: 'Caja menor' },
]

export function JournalsPage() {
  const propertyId = usePropertyId()
  const [source, setSource] = useState<string | null>('')
  const query = useQuery({
    queryKey: ['accounting-journals', propertyId],
    queryFn: async () => {
      const { data } = await api.get<JournalEntry[]>(
        `/api/accounting/journals?horizontalPropertyId=${encodeURIComponent(propertyId)}`,
      )
      return data
    },
  })

  const filtered = useMemo(
    () => JournalList_FilterBySource(query.data ?? [], source ? Number(source) : null),
    [query.data, source],
  )

  return (
    <Stack gap="md">
      <PageHeader title="Asientos contables" description="Diario generado desde cartera y operaciones." />
      <Select
        label="Origen"
        data={SOURCE_OPTIONS}
        value={source}
        onChange={setSource}
        clearable={false}
        w={220}
      />
      {query.isLoading ? <Loader size="sm" /> : null}
      {query.isError ? <Text c="red">{getApiErrorMessage(query.error)}</Text> : null}
      <Table striped>
        <Table.Thead>
          <Table.Tr>
            <Table.Th>Fecha</Table.Th>
            <Table.Th>Descripción</Table.Th>
            <Table.Th>Débito</Table.Th>
            <Table.Th>Crédito</Table.Th>
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>
          {filtered.map((e) => (
            <Table.Tr key={e.id}>
              <Table.Td>{new Date(e.entryDate).toLocaleDateString('es-CO')}</Table.Td>
              <Table.Td>{e.description}</Table.Td>
              <Table.Td>{formatMoney(e.totalDebit)}</Table.Td>
              <Table.Td>{formatMoney(e.totalCredit)}</Table.Td>
            </Table.Tr>
          ))}
        </Table.Tbody>
      </Table>
    </Stack>
  )
}
