import { Badge, Button, Loader, Stack, Table, Text, TextInput } from '@mantine/core'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { api } from '../../../api/client'
import { getApiErrorMessage } from '../../../api/errors'
import { PageHeader } from '../../../components/shared/PageHeader'
import { usePropertyId } from '../../../hooks/usePropertyId'
import { InsuranceForm_Validation } from '../lib/insuranceFormValidation'

type InsurancePolicy = {
  id: string
  insurerName: string
  policyNumber: string
  endDate: string
  expiringSoon: boolean
}

export function InsurancePage() {
  const propertyId = usePropertyId()
  const queryClient = useQueryClient()
  const [insurerName, setInsurerName] = useState('')
  const [policyNumber, setPolicyNumber] = useState('')
  const [endDate, setEndDate] = useState('')

  const listQuery = useQuery({
    queryKey: ['insurance', propertyId],
    queryFn: async () => {
      const { data } = await api.get<InsurancePolicy[]>('/api/insurance', {
        params: { horizontalPropertyId: propertyId },
      })
      return data
    },
  })

  const createMutation = useMutation({
    mutationFn: async () => {
      await api.post('/api/insurance', {
        horizontalPropertyId: propertyId,
        insurerName,
        policyNumber,
        startDate: endDate,
        endDate,
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['insurance', propertyId] })
      setInsurerName('')
      setPolicyNumber('')
      setEndDate('')
    },
  })

  const alertsMutation = useMutation({
    mutationFn: async () => {
      const { data } = await api.post<number>('/api/insurance/run-alerts')
      return data
    },
  })

  const canCreate = InsuranceForm_Validation(insurerName, policyNumber, endDate)

  return (
    <Stack gap="md">
      <PageHeader title="Pólizas de seguros" description="Registro y alertas de vencimiento." />
      <Stack gap="xs">
        <TextInput label="Aseguradora" value={insurerName} onChange={(e) => setInsurerName(e.currentTarget.value)} />
        <TextInput label="Número de póliza" value={policyNumber} onChange={(e) => setPolicyNumber(e.currentTarget.value)} />
        <TextInput label="Fecha fin" type="date" value={endDate} onChange={(e) => setEndDate(e.currentTarget.value)} />
        <Button disabled={!canCreate} loading={createMutation.isPending} onClick={() => createMutation.mutate()}>
          Registrar póliza
        </Button>
        <Button variant="light" loading={alertsMutation.isPending} onClick={() => alertsMutation.mutate()}>
          Ejecutar alertas
        </Button>
        {alertsMutation.data != null ? <Text size="sm">Alertas enviadas: {alertsMutation.data}</Text> : null}
      </Stack>
      {listQuery.isLoading ? <Loader size="sm" /> : null}
      <Table striped>
        <Table.Thead>
          <Table.Tr>
            <Table.Th>Aseguradora</Table.Th>
            <Table.Th>Póliza</Table.Th>
            <Table.Th>Vence</Table.Th>
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>
          {(listQuery.data ?? []).map((p) => (
            <Table.Tr key={p.id}>
              <Table.Td>{p.insurerName}</Table.Td>
              <Table.Td>{p.policyNumber}</Table.Td>
              <Table.Td>
                {p.endDate}
                {p.expiringSoon ? <Badge ml="xs" color="orange">Por vencer</Badge> : null}
              </Table.Td>
            </Table.Tr>
          ))}
        </Table.Tbody>
      </Table>
      {createMutation.isError ? <Text c="red">{getApiErrorMessage(createMutation.error)}</Text> : null}
    </Stack>
  )
}
