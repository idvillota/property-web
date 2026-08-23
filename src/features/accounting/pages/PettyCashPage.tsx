import { Button, FileButton, NumberInput, Stack, Table, Text, TextInput } from '@mantine/core'
import { notifications } from '@mantine/notifications'
import { useMutation, useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import { api } from '../../../api/client'
import { getApiErrorMessage } from '../../../api/errors'
import { PageHeader } from '../../../components/shared/PageHeader'
import { useInvalidate } from '../../../hooks/useInvalidate'
import { usePropertyId } from '../../../hooks/usePropertyId'
import { formatMoney } from '../../../lib/money'
import { PettyCashForm_AttachmentRequired } from '../lib/pettyCashFormAttachmentRequired'

type Fund = { id: string; name: string; currentBalance: number; openingBalance: number }

export function PettyCashPage() {
  const propertyId = usePropertyId()
  const invalidate = useInvalidate(['accounting-petty'])
  const [fundName, setFundName] = useState('Caja menor')
  const [opening, setOpening] = useState(500000)
  const [fundId, setFundId] = useState<string | null>(null)
  const [amount, setAmount] = useState(0)
  const [description, setDescription] = useState('')
  const [fileId, setFileId] = useState<string | null>(null)

  const funds = useQuery({
    queryKey: ['accounting-petty', propertyId],
    queryFn: async () =>
      (
        await api.get<Fund[]>(
          `/api/accounting/petty-cash?horizontalPropertyId=${encodeURIComponent(propertyId)}`,
        )
      ).data,
  })

  const createFund = useMutation({
    mutationFn: async () =>
      (
        await api.post('/api/accounting/petty-cash', {
          horizontalPropertyId: propertyId,
          name: fundName,
          openingBalance: opening,
        })
      ).data,
    onSuccess: () => {
      notifications.show({ color: 'green', message: 'Fondo creado' })
      void invalidate()
    },
    onError: (e) => notifications.show({ color: 'red', message: getApiErrorMessage(e) }),
  })

  const upload = useMutation({
    mutationFn: async (file: File) => {
      const form = new FormData()
      form.append('file', file)
      form.append('purpose', 'petty-cash')
      const { data } = await api.post<{ id: string }>('/api/files', form)
      return data.id
    },
    onSuccess: (id) => setFileId(id),
    onError: (e) => notifications.show({ color: 'red', message: getApiErrorMessage(e) }),
  })

  const createExpense = useMutation({
    mutationFn: async () => {
      if (!PettyCashForm_AttachmentRequired(fileId)) throw new Error('El soporte es obligatorio.')
      return (
        await api.post('/api/accounting/petty-cash/expenses', {
          pettyCashFundId: fundId,
          amount,
          description,
          spentAt: new Date().toISOString(),
          supportFileAssetId: fileId,
        })
      ).data
    },
    onSuccess: () => {
      notifications.show({ color: 'green', message: 'Gasto legalizado' })
      setAmount(0)
      setDescription('')
      setFileId(null)
      void invalidate()
    },
    onError: (e) => notifications.show({ color: 'red', message: getApiErrorMessage(e) }),
  })

  return (
    <Stack gap="md">
      <PageHeader title="Caja menor" description="Fondos y legalización con soporte adjunto." />
      <TextInput label="Nombre del fondo" value={fundName} onChange={(e) => setFundName(e.currentTarget.value)} />
      <NumberInput label="Saldo inicial" value={opening} onChange={(v) => setOpening(Number(v) || 0)} />
      <Button w={160} onClick={() => createFund.mutate()} loading={createFund.isPending}>
        Crear fondo
      </Button>
      <Table striped>
        <Table.Thead>
          <Table.Tr>
            <Table.Th>Fondo</Table.Th>
            <Table.Th>Saldo</Table.Th>
            <Table.Th />
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>
          {(funds.data ?? []).map((f) => (
            <Table.Tr key={f.id}>
              <Table.Td>{f.name}</Table.Td>
              <Table.Td>{formatMoney(f.currentBalance)}</Table.Td>
              <Table.Td>
                <Button size="xs" variant="light" onClick={() => setFundId(f.id)}>
                  Usar
                </Button>
              </Table.Td>
            </Table.Tr>
          ))}
        </Table.Tbody>
      </Table>
      {fundId ? (
        <Stack gap="xs">
          <Text fw={600}>Legalizar gasto</Text>
          <NumberInput label="Monto" value={amount} onChange={(v) => setAmount(Number(v) || 0)} />
          <TextInput label="Descripción" value={description} onChange={(e) => setDescription(e.currentTarget.value)} />
          <FileButton onChange={(f) => f && upload.mutate(f)} accept="image/*,application/pdf">
            {(props) => (
              <Button {...props} variant="default" loading={upload.isPending}>
                {fileId ? 'Soporte cargado' : 'Adjuntar soporte'}
              </Button>
            )}
          </FileButton>
          <Button
            w={200}
            disabled={!PettyCashForm_AttachmentRequired(fileId)}
            onClick={() => createExpense.mutate()}
            loading={createExpense.isPending}
          >
            Registrar gasto
          </Button>
        </Stack>
      ) : null}
    </Stack>
  )
}
