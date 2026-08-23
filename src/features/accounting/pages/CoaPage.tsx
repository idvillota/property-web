import { Loader, Stack, Table, Text } from '@mantine/core'
import { useQuery } from '@tanstack/react-query'
import { api } from '../../../api/client'
import { getApiErrorMessage } from '../../../api/errors'
import { PageHeader } from '../../../components/shared/PageHeader'
import { CoaPage_ListsAccounts } from '../lib/coaPageListsAccounts'

type LedgerAccount = {
  id: string
  code: string
  name: string
  accountType: number
  isPostable: boolean
  isActive: boolean
}

export function CoaPage() {
  const query = useQuery({
    queryKey: ['accounting-coa'],
    queryFn: async () => {
      const { data } = await api.get<LedgerAccount[]>('/api/accounting/coa')
      return data
    },
  })

  const accounts = query.data ?? []
  const listsOk = CoaPage_ListsAccounts(accounts)

  return (
    <Stack gap="md">
      <PageHeader title="Plan de cuentas (PUC)" description="Catálogo contable seed para propiedad horizontal." />
      {query.isLoading ? <Loader size="sm" /> : null}
      {query.isError ? <Text c="red">{getApiErrorMessage(query.error)}</Text> : null}
      {listsOk ? (
        <Table striped highlightOnHover>
          <Table.Thead>
            <Table.Tr>
              <Table.Th>Código</Table.Th>
              <Table.Th>Nombre</Table.Th>
              <Table.Th>Imputable</Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {accounts.map((a) => (
              <Table.Tr key={a.id}>
                <Table.Td>{a.code}</Table.Td>
                <Table.Td>{a.name}</Table.Td>
                <Table.Td>{a.isPostable ? 'Sí' : 'No'}</Table.Td>
              </Table.Tr>
            ))}
          </Table.Tbody>
        </Table>
      ) : null}
    </Stack>
  )
}
