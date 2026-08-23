import { Badge, Loader, Stack, Table, Text } from '@mantine/core'
import { useQuery } from '@tanstack/react-query'
import { api } from '../../../api/client'
import { getApiErrorMessage } from '../../../api/errors'
import { PageHeader } from '../../../components/shared/PageHeader'
import { usePropertyId } from '../../../hooks/usePropertyId'
import { MaintenanceList_HighlightsOverdue } from '../lib/maintenanceListHighlightsOverdue'

type MaintenancePlan = {
  id: string
  name: string
  tasks: { id: string; title: string; dueDate: string; isOverdue: boolean; status: number }[]
}

export function MaintenancePage() {
  const propertyId = usePropertyId()

  const query = useQuery({
    queryKey: ['maintenance', propertyId],
    queryFn: async () => {
      const { data } = await api.get<MaintenancePlan[]>('/api/maintenance', {
        params: { horizontalPropertyId: propertyId },
      })
      return data
    },
  })

  const allTasks = (query.data ?? []).flatMap((p) => p.tasks)
  const hasOverdue = MaintenanceList_HighlightsOverdue(allTasks)

  return (
    <Stack gap="md">
      <PageHeader title="Mantenimiento preventivo" description="Planes y tareas programadas." />
      {hasOverdue ? <Badge color="red">Hay tareas vencidas</Badge> : null}
      {query.isLoading ? <Loader size="sm" /> : null}
      {query.isError ? <Text c="red">{getApiErrorMessage(query.error)}</Text> : null}
      {(query.data ?? []).map((plan) => (
        <Stack key={plan.id} gap="xs">
          <Text fw={600}>{plan.name}</Text>
          <Table striped>
            <Table.Thead>
              <Table.Tr>
                <Table.Th>Tarea</Table.Th>
                <Table.Th>Vence</Table.Th>
                <Table.Th>Estado</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {plan.tasks.map((t) => (
                <Table.Tr key={t.id} style={t.isOverdue ? { backgroundColor: 'var(--mantine-color-red-0)' } : undefined}>
                  <Table.Td>{t.title}</Table.Td>
                  <Table.Td>{t.dueDate}</Table.Td>
                  <Table.Td>{t.isOverdue ? 'Vencida' : 'Pendiente'}</Table.Td>
                </Table.Tr>
              ))}
            </Table.Tbody>
          </Table>
        </Stack>
      ))}
    </Stack>
  )
}
