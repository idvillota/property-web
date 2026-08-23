import { Button, Loader, Stack, Table, Text } from '@mantine/core'
import { useQuery } from '@tanstack/react-query'
import { api } from '../../../api/client'
import { getApiErrorMessage } from '../../../api/errors'
import { PageHeader } from '../../../components/shared/PageHeader'
import { usePropertyId } from '../../../hooks/usePropertyId'

type Poll = {
  id: string
  title: string
  status: number
  options: { id: string; label: string; voteCount: number }[]
}

export function PollsPage() {
  const propertyId = usePropertyId()

  const query = useQuery({
    queryKey: ['polls-admin', propertyId],
    queryFn: async () => {
      const { data } = await api.get<Poll[]>('/api/polls', {
        params: { horizontalPropertyId: propertyId },
      })
      return data
    },
  })

  return (
    <Stack gap="md">
      <PageHeader title="Encuestas y votaciones" description="Gestión de encuestas de la comunidad." />
      {query.isLoading ? <Loader size="sm" /> : null}
      {query.isError ? <Text c="red">{getApiErrorMessage(query.error)}</Text> : null}
      {(query.data ?? []).map((poll) => (
        <Stack key={poll.id} gap="xs">
          <Text fw={600}>{poll.title}</Text>
          <Table striped>
            <Table.Thead>
              <Table.Tr>
                <Table.Th>Opción</Table.Th>
                <Table.Th>Votos</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {poll.options.map((o) => (
                <Table.Tr key={o.id}>
                  <Table.Td>{o.label}</Table.Td>
                  <Table.Td>{o.voteCount}</Table.Td>
                </Table.Tr>
              ))}
            </Table.Tbody>
          </Table>
        </Stack>
      ))}
    </Stack>
  )
}
