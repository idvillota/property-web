import { Button, NumberInput, Stack, Table, Text, TextInput } from '@mantine/core'
import { notifications } from '@mantine/notifications'
import { useMutation, useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import { api } from '../../../api/client'
import { getApiErrorMessage } from '../../../api/errors'
import { PageHeader } from '../../../components/shared/PageHeader'
import { useInvalidate } from '../../../hooks/useInvalidate'
import { usePropertyId } from '../../../hooks/usePropertyId'
import { formatMoney } from '../../../lib/money'
import { BankRec_UI_MatchAction } from '../lib/bankRecUiMatchAction'

type Statement = {
  id: string
  accountLabel: string
  lines: {
    id: string
    description: string
    amount: number
    matchStatus: number
    matchedPaymentId?: string | null
  }[]
}

export function BankRecPage() {
  const propertyId = usePropertyId()
  const invalidate = useInvalidate(['accounting-bank'])
  const [label, setLabel] = useState('Cuenta bancaria')
  const [lineDesc, setLineDesc] = useState('')
  const [lineAmount, setLineAmount] = useState(0)
  const [paymentId, setPaymentId] = useState('')
  const [selectedLine, setSelectedLine] = useState<string | null>(null)

  const list = useQuery({
    queryKey: ['accounting-bank', propertyId],
    queryFn: async () =>
      (
        await api.get<Statement[]>(
          `/api/accounting/bank-statements?horizontalPropertyId=${encodeURIComponent(propertyId)}`,
        )
      ).data,
  })

  const create = useMutation({
    mutationFn: async () => {
      const today = new Date().toISOString().slice(0, 10)
      return (
        await api.post('/api/accounting/bank-statements', {
          horizontalPropertyId: propertyId,
          accountLabel: label,
          periodFrom: today,
          periodTo: today,
          lines: [{ transactionDate: today, description: lineDesc, amount: lineAmount }],
        })
      ).data
    },
    onSuccess: () => {
      notifications.show({ color: 'green', message: 'Extracto creado' })
      void invalidate()
    },
    onError: (e) => notifications.show({ color: 'red', message: getApiErrorMessage(e) }),
  })

  const match = useMutation({
    mutationFn: async () => {
      if (!BankRec_UI_MatchAction(selectedLine, paymentId)) throw new Error('Seleccione línea y pago.')
      return (
        await api.post('/api/accounting/bank-statements/match', {
          bankStatementLineId: selectedLine,
          paymentId,
        })
      ).data
    },
    onSuccess: () => {
      notifications.show({ color: 'green', message: 'Línea conciliada' })
      setSelectedLine(null)
      setPaymentId('')
      void invalidate()
    },
    onError: (e) => notifications.show({ color: 'red', message: getApiErrorMessage(e) }),
  })

  const lines = (list.data ?? []).flatMap((s) => s.lines.map((l) => ({ ...l, accountLabel: s.accountLabel })))

  return (
    <Stack gap="md">
      <PageHeader title="Conciliación bancaria" description="Cargue extracto y concilie contra pagos." />
      <TextInput label="Cuenta" value={label} onChange={(e) => setLabel(e.currentTarget.value)} />
      <TextInput label="Descripción línea" value={lineDesc} onChange={(e) => setLineDesc(e.currentTarget.value)} />
      <NumberInput label="Monto" value={lineAmount} onChange={(v) => setLineAmount(Number(v) || 0)} />
      <Button w={180} onClick={() => create.mutate()} loading={create.isPending}>
        Agregar extracto
      </Button>
      <Table striped>
        <Table.Thead>
          <Table.Tr>
            <Table.Th>Descripción</Table.Th>
            <Table.Th>Monto</Table.Th>
            <Table.Th>Estado</Table.Th>
            <Table.Th />
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>
          {lines.map((l) => (
            <Table.Tr key={l.id}>
              <Table.Td>{l.description}</Table.Td>
              <Table.Td>{formatMoney(l.amount)}</Table.Td>
              <Table.Td>{l.matchStatus === 1 ? 'Conciliado' : 'Pendiente'}</Table.Td>
              <Table.Td>
                {l.matchStatus === 0 ? (
                  <Button size="xs" variant="light" onClick={() => setSelectedLine(l.id)}>
                    Conciliar
                  </Button>
                ) : null}
              </Table.Td>
            </Table.Tr>
          ))}
        </Table.Tbody>
      </Table>
      {selectedLine ? (
        <Stack gap="xs">
          <TextInput
            label="Id del pago a conciliar"
            value={paymentId}
            onChange={(e) => setPaymentId(e.currentTarget.value)}
          />
          <Button
            w={200}
            disabled={!BankRec_UI_MatchAction(selectedLine, paymentId)}
            onClick={() => match.mutate()}
            loading={match.isPending}
          >
            Confirmar match
          </Button>
        </Stack>
      ) : null}
    </Stack>
  )
}
