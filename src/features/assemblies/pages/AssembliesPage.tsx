import { Button, Loader, Stack, Table, Text, TextInput } from '@mantine/core'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { api } from '../../../api/client'
import { getApiErrorMessage } from '../../../api/errors'
import { PageHeader } from '../../../components/shared/PageHeader'
import { usePropertyId } from '../../../hooks/usePropertyId'
import { AssemblyForm_RequiresDate } from '../lib/assemblyFormRequiresDate'
import { AssemblyAttendance_ShowsQuorum } from '../lib/assemblyAttendanceShowsQuorum'

type Assembly = {
  id: string
  title: string
  scheduledAtUtc: string
  status: number
}

export function AssembliesPage() {
  const propertyId = usePropertyId()
  const queryClient = useQueryClient()
  const [title, setTitle] = useState('')
  const [scheduledAt, setScheduledAt] = useState('')

  const listQuery = useQuery({
    queryKey: ['assemblies', propertyId],
    queryFn: async () => {
      const { data } = await api.get<Assembly[]>('/api/assemblies', {
        params: { horizontalPropertyId: propertyId },
      })
      return data
    },
  })

  const createMutation = useMutation({
    mutationFn: async () => {
      await api.post('/api/assemblies', {
        horizontalPropertyId: propertyId,
        title,
        scheduledAtUtc: new Date(scheduledAt).toISOString(),
        agendaItems: [{ sortOrder: 1, title: 'Orden del día' }],
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assemblies', propertyId] })
      setTitle('')
      setScheduledAt('')
    },
  })

  const canCreate = AssemblyForm_RequiresDate(scheduledAt) && title.trim().length > 0

  return (
    <Stack gap="md">
      <PageHeader title="Asambleas" description="Convocatorias y orden del día." />
      <Stack gap="xs">
        <TextInput label="Título" value={title} onChange={(e) => setTitle(e.currentTarget.value)} />
        <TextInput
          label="Fecha programada"
          type="datetime-local"
          value={scheduledAt}
          onChange={(e) => setScheduledAt(e.currentTarget.value)}
        />
        <Button disabled={!canCreate} loading={createMutation.isPending} onClick={() => createMutation.mutate()}>
          Crear asamblea
        </Button>
        {createMutation.isError ? <Text c="red">{getApiErrorMessage(createMutation.error)}</Text> : null}
      </Stack>
      {listQuery.isLoading ? <Loader size="sm" /> : null}
      {listQuery.isError ? <Text c="red">{getApiErrorMessage(listQuery.error)}</Text> : null}
      <Table striped highlightOnHover>
        <Table.Thead>
          <Table.Tr>
            <Table.Th>Título</Table.Th>
            <Table.Th>Fecha</Table.Th>
            <Table.Th>Acciones</Table.Th>
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>
          {(listQuery.data ?? []).map((a) => (
            <Table.Tr key={a.id}>
              <Table.Td>{a.title}</Table.Td>
              <Table.Td>{new Date(a.scheduledAtUtc).toLocaleString('es-CO')}</Table.Td>
              <Table.Td>
                <Text component={Link} to={`${a.id}/attendance`} size="sm">
                  Asistencia
                </Text>
                {' · '}
                <Text component={Link} to={`${a.id}/votes`} size="sm">
                  Votaciones
                </Text>
              </Table.Td>
            </Table.Tr>
          ))}
        </Table.Tbody>
      </Table>
    </Stack>
  )
}

export function AssemblyAttendancePage() {
  const propertyId = usePropertyId()
  const { assemblyId } = useParams<{ assemblyId?: string }>()
  const [assemblyIdInput, setAssemblyIdInput] = useState(assemblyId ?? '')

  const quorumQuery = useQuery({
    queryKey: ['assembly-quorum', assemblyIdInput],
    enabled: Boolean(assemblyIdInput),
    queryFn: async () => {
      const { data } = await api.get(`/api/assemblies/${assemblyIdInput}/quorum`)
      return data as { achievedPercent: number; hasQuorum: boolean; representedCoefficient: number; totalCoefficient: number }
    },
  })

  return (
    <Stack gap="md">
      <PageHeader title="Asistencia y quórum" description="Registro de asistencia por coeficiente." />
      <TextInput
        label="ID asamblea"
        value={assemblyIdInput}
        onChange={(e) => setAssemblyIdInput(e.currentTarget.value)}
      />
      {quorumQuery.isLoading ? <Loader size="sm" /> : null}
      {quorumQuery.data && AssemblyAttendance_ShowsQuorum(quorumQuery.data) ? (
        <Text>
          Quórum: {quorumQuery.data.hasQuorum ? 'Sí' : 'No'} ({quorumQuery.data.achievedPercent}%) —{' '}
          {quorumQuery.data.representedCoefficient}/{quorumQuery.data.totalCoefficient}
        </Text>
      ) : null}
      <Text size="sm" c="dimmed">
        Propiedad: {propertyId}
      </Text>
    </Stack>
  )
}

export function AssemblyVotesPage() {
  const propertyId = usePropertyId()
  const { assemblyId } = useParams<{ assemblyId: string }>()

  const resultsQuery = useQuery({
    queryKey: ['assembly-results', assemblyId],
    queryFn: async () => {
      const { data } = await api.get(`/api/assemblies/${assemblyId}/results`)
      return data as { title: string; yesWeight: number; noWeight: number }[]
    },
  })

  return (
    <Stack gap="md">
      <PageHeader title="Votaciones" description="Resultados de mociones." />
      {resultsQuery.isLoading ? <Loader size="sm" /> : null}
      <Table striped>
        <Table.Thead>
          <Table.Tr>
            <Table.Th>Moción</Table.Th>
            <Table.Th>Sí</Table.Th>
            <Table.Th>No</Table.Th>
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>
          {(resultsQuery.data ?? []).map((r, i) => (
            <Table.Tr key={i}>
              <Table.Td>{r.title}</Table.Td>
              <Table.Td>{r.yesWeight}</Table.Td>
              <Table.Td>{r.noWeight}</Table.Td>
            </Table.Tr>
          ))}
        </Table.Tbody>
      </Table>
      <Text size="sm" c="dimmed">
        Propiedad: {propertyId}
      </Text>
    </Stack>
  )
}
