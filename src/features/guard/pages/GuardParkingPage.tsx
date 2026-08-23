import { Alert, Button, Loader, Stack, Text, TextInput, Title } from '@mantine/core'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { api } from '../../../api/client'
import { getApiErrorMessage } from '../../../api/errors'
import { useCurrentProperty } from '../../../hooks/useCurrentProperty'
import { GuardParking_IssueTicket } from '../../parking/lib/guardParkingIssueTicket'

type ParkingTicket = {
  id: string
  code: string
  plate: string
  feeAmount?: number
}

export function GuardParkingPage() {
  const propertyQuery = useCurrentProperty()
  const propertyId = propertyQuery.data?.id
  const queryClient = useQueryClient()
  const [plate, setPlate] = useState('')
  const [lastTicket, setLastTicket] = useState<ParkingTicket | null>(null)

  const shiftQuery = useQuery({
    queryKey: ['guard-parking-shift', propertyId],
    enabled: Boolean(propertyId),
    queryFn: async () => {
      const { data } = await api.get('/api/visitor-parking/shifts/open', {
        params: { horizontalPropertyId: propertyId },
      })
      return data
    },
    retry: false,
  })

  const openShiftMutation = useMutation({
    mutationFn: async () => {
      await api.post('/api/visitor-parking/shifts/open', { horizontalPropertyId: propertyId })
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['guard-parking-shift', propertyId] }),
  })

  const issueMutation = useMutation({
    mutationFn: async () => {
      const { data } = await api.post<ParkingTicket>('/api/visitor-parking/tickets', {
        horizontalPropertyId: propertyId,
        plate: plate.trim().toUpperCase(),
      })
      return data
    },
    onSuccess: (ticket) => {
      setLastTicket(ticket)
      setPlate('')
    },
  })

  const exitMutation = useMutation({
    mutationFn: async (ticketId: string) => {
      const { data } = await api.post<ParkingTicket>('/api/visitor-parking/tickets/exit', { ticketId })
      return data
    },
    onSuccess: (ticket) => setLastTicket(ticket),
  })

  if (propertyQuery.isLoading) {
    return <Loader size="sm" />
  }

  if (!propertyId) {
    return (
      <Alert color="orange" title="Sin propiedad">
        El vigilador debe tener una propiedad horizontal asignada.
      </Alert>
    )
  }

  const canIssue = GuardParking_IssueTicket(plate)

  return (
    <Stack gap="md">
      <Title order={3} style={{ fontFamily: 'Fraunces, Georgia, serif' }}>
        Parqueadero visitantes
      </Title>
      {shiftQuery.isLoading ? <Loader size="sm" /> : null}
      {!shiftQuery.data && !shiftQuery.isLoading ? (
        <Button loading={openShiftMutation.isPending} onClick={() => openShiftMutation.mutate()}>
          Abrir turno de caja
        </Button>
      ) : null}
      {shiftQuery.data ? (
        <Stack gap="xs">
          <Text size="sm">Turno abierto — emita tickets de ingreso.</Text>
          <TextInput
            label="Placa"
            placeholder="ABC123"
            value={plate}
            onChange={(e) => setPlate(e.currentTarget.value.toUpperCase())}
          />
          <Button disabled={!canIssue} loading={issueMutation.isPending} onClick={() => issueMutation.mutate()}>
            Emitir ticket
          </Button>
        </Stack>
      ) : null}
      {lastTicket ? (
        <Alert color="teal" title={`Ticket ${lastTicket.code}`}>
          <Text size="sm">Placa: {lastTicket.plate}</Text>
          {lastTicket.feeAmount == null ? (
            <Button mt="sm" size="xs" loading={exitMutation.isPending} onClick={() => exitMutation.mutate(lastTicket.id)}>
              Registrar salida
            </Button>
          ) : (
            <Text size="sm">Cobro: ${lastTicket.feeAmount?.toLocaleString('es-CO')}</Text>
          )}
        </Alert>
      ) : null}
      {issueMutation.isError ? <Text c="red">{getApiErrorMessage(issueMutation.error)}</Text> : null}
    </Stack>
  )
}
