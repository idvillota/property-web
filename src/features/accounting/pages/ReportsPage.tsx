import { Button, Group, Modal, NumberInput, Stack, Table, Text } from '@mantine/core'
import { notifications } from '@mantine/notifications'
import { useMutation, useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import { api } from '../../../api/client'
import { getApiErrorMessage } from '../../../api/errors'
import { PageHeader } from '../../../components/shared/PageHeader'
import { useInvalidate } from '../../../hooks/useInvalidate'
import { usePropertyId } from '../../../hooks/usePropertyId'
import { formatMoney } from '../../../lib/money'
import { ClosePeriod_ConfirmDialog } from '../lib/closePeriodConfirmDialog'

type Statements = {
  totalAssets: number
  totalLiabilitiesEquity: number
  isBalanced: boolean
  rows: { accountCode: string; accountName: string; balance: number }[]
}

export function AccountingReportsPage() {
  const propertyId = usePropertyId()
  const now = new Date()
  const [year, setYear] = useState(now.getFullYear())
  const [month, setMonth] = useState(now.getMonth() + 1)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const invalidate = useInvalidate(['accounting-statements', 'accounting-periods'])

  const statements = useQuery({
    queryKey: ['accounting-statements', propertyId, year, month],
    queryFn: async () =>
      (
        await api.get<Statements>(
          `/api/accounting/reports/statements?horizontalPropertyId=${encodeURIComponent(propertyId)}&year=${year}&month=${month}`,
        )
      ).data,
  })

  const close = useMutation({
    mutationFn: async () =>
      (
        await api.post('/api/accounting/periods/close', {
          horizontalPropertyId: propertyId,
          year,
          month,
        })
      ).data,
    onSuccess: () => {
      notifications.show({ color: 'green', message: 'Período cerrado' })
      setConfirmOpen(false)
      void invalidate()
    },
    onError: (e) => notifications.show({ color: 'red', message: getApiErrorMessage(e) }),
  })

  return (
    <Stack gap="md">
      <PageHeader title="Estados financieros y cierre" description="Balance de prueba y cierre mensual." />
      <Group>
        <NumberInput label="Año" value={year} onChange={(v) => setYear(Number(v) || year)} w={120} />
        <NumberInput label="Mes" value={month} onChange={(v) => setMonth(Number(v) || month)} min={1} max={12} w={100} />
        <Button mt={24} color="red" variant="light" onClick={() => setConfirmOpen(true)}>
          Cerrar período
        </Button>
      </Group>
      {statements.data ? (
        <>
          <Text>
            Activo: {formatMoney(statements.data.totalAssets)} · Pasivo+Patrimonio:{' '}
            {formatMoney(statements.data.totalLiabilitiesEquity)} ·{' '}
            {statements.data.isBalanced ? 'Cuadra' : 'No cuadra'}
          </Text>
          <Table striped>
            <Table.Thead>
              <Table.Tr>
                <Table.Th>Cuenta</Table.Th>
                <Table.Th>Saldo</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {statements.data.rows.map((r) => (
                <Table.Tr key={r.accountCode}>
                  <Table.Td>
                    {r.accountCode} — {r.accountName}
                  </Table.Td>
                  <Table.Td>{formatMoney(r.balance)}</Table.Td>
                </Table.Tr>
              ))}
            </Table.Tbody>
          </Table>
        </>
      ) : null}
      <Modal opened={confirmOpen} onClose={() => setConfirmOpen(false)} title="Confirmar cierre">
        <Stack>
          <Text>
            ¿Cerrar el período {year}-{String(month).padStart(2, '0')}? No se podrán registrar asientos en ese mes.
          </Text>
          <Button
            color="red"
            loading={close.isPending}
            onClick={() => {
              if (ClosePeriod_ConfirmDialog(true, year, month)) close.mutate()
            }}
          >
            Confirmar cierre
          </Button>
        </Stack>
      </Modal>
    </Stack>
  )
}
