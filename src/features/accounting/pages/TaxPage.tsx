import { Button, NumberInput, Select, Stack, Table, Text, TextInput } from '@mantine/core'
import { notifications } from '@mantine/notifications'
import { useMutation, useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import { api } from '../../../api/client'
import { getApiErrorMessage } from '../../../api/errors'
import { PageHeader } from '../../../components/shared/PageHeader'
import { useInvalidate } from '../../../hooks/useInvalidate'
import { usePropertyId } from '../../../hooks/usePropertyId'
import { formatMoney } from '../../../lib/money'
import { TaxSettings_SaveRates } from '../lib/taxSettingsSaveRates'

type Rate = { id: string; kind: number; name: string; ratePercent: number; minimumBase: number }
type ExportRow = {
  invoiceNumber: string
  vendorName: string
  baseAmount: number
  withholdingAmount: number
  issueDate: string
}

export function TaxPage() {
  const propertyId = usePropertyId()
  const invalidate = useInvalidate(['accounting-tax'])
  const [kind, setKind] = useState('0')
  const [name, setName] = useState('ReteFuente')
  const [rate, setRate] = useState(11)
  const [minBase, setMinBase] = useState(0)
  const year = new Date().getFullYear()

  const rates = useQuery({
    queryKey: ['accounting-tax'],
    queryFn: async () => (await api.get<Rate[]>('/api/accounting/tax/rates')).data,
  })
  const exportQ = useQuery({
    queryKey: ['accounting-tax-export', propertyId, year],
    queryFn: async () =>
      (
        await api.get<ExportRow[]>(
          `/api/accounting/tax/export?horizontalPropertyId=${encodeURIComponent(propertyId)}&year=${year}`,
        )
      ).data,
  })

  const save = useMutation({
    mutationFn: async () => {
      if (!TaxSettings_SaveRates(rate, name)) throw new Error('Datos de tarifa inválidos.')
      return (
        await api.put('/api/accounting/tax/rates', {
          kind: Number(kind),
          name,
          ratePercent: rate,
          minimumBase: minBase,
          isActive: true,
        })
      ).data
    },
    onSuccess: () => {
      notifications.show({ color: 'green', message: 'Tarifa guardada' })
      void invalidate()
    },
    onError: (e) => notifications.show({ color: 'red', message: getApiErrorMessage(e) }),
  })

  return (
    <Stack gap="md">
      <PageHeader title="Retenciones" description="Configuración ReteFuente / ICA y exportación." />
      <Select
        label="Tipo"
        data={[
          { value: '0', label: 'ReteFuente' },
          { value: '1', label: 'ICA' },
        ]}
        value={kind}
        onChange={(v) => setKind(v ?? '0')}
      />
      <TextInput label="Nombre" value={name} onChange={(e) => setName(e.currentTarget.value)} />
      <NumberInput label="% tarifa" value={rate} onChange={(v) => setRate(Number(v) || 0)} decimalScale={4} />
      <NumberInput label="Base mínima" value={minBase} onChange={(v) => setMinBase(Number(v) || 0)} />
      <Button w={160} onClick={() => save.mutate()} loading={save.isPending} disabled={!TaxSettings_SaveRates(rate, name)}>
        Guardar tarifa
      </Button>
      <Table striped>
        <Table.Thead>
          <Table.Tr>
            <Table.Th>Nombre</Table.Th>
            <Table.Th>%</Table.Th>
            <Table.Th>Base mín.</Table.Th>
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>
          {(rates.data ?? []).map((r) => (
            <Table.Tr key={r.id}>
              <Table.Td>{r.name}</Table.Td>
              <Table.Td>{r.ratePercent}</Table.Td>
              <Table.Td>{formatMoney(r.minimumBase)}</Table.Td>
            </Table.Tr>
          ))}
        </Table.Tbody>
      </Table>
      <Text fw={600}>Exportación {year}</Text>
      <Table striped>
        <Table.Thead>
          <Table.Tr>
            <Table.Th>Factura</Table.Th>
            <Table.Th>Proveedor</Table.Th>
            <Table.Th>Base</Table.Th>
            <Table.Th>Retención</Table.Th>
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>
          {(exportQ.data ?? []).map((r, i) => (
            <Table.Tr key={`${r.invoiceNumber}-${i}`}>
              <Table.Td>{r.invoiceNumber}</Table.Td>
              <Table.Td>{r.vendorName}</Table.Td>
              <Table.Td>{formatMoney(r.baseAmount)}</Table.Td>
              <Table.Td>{formatMoney(r.withholdingAmount)}</Table.Td>
            </Table.Tr>
          ))}
        </Table.Tbody>
      </Table>
    </Stack>
  )
}
