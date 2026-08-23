import { Button, NumberInput, Select, Stack, Table, Text, TextInput } from '@mantine/core'
import { useForm } from '@mantine/form'
import { notifications } from '@mantine/notifications'
import { useMutation, useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import { api } from '../../../api/client'
import { getApiErrorMessage } from '../../../api/errors'
import { PageHeader } from '../../../components/shared/PageHeader'
import { useInvalidate } from '../../../hooks/useInvalidate'
import { usePropertyId } from '../../../hooks/usePropertyId'
import { formatMoney } from '../../../lib/money'
import { ApInvoiceForm_RequiresVendor } from '../lib/apInvoiceFormRequiresVendor'

type Vendor = { id: string; name: string }
type Account = { id: string; code: string; name: string; isPostable: boolean }
type Invoice = {
  id: string
  vendorName: string
  invoiceNumber: string
  subtotal: number
  withholdingAmount: number
  total: number
  amountPaid: number
  balance: number
}

export function ApPage() {
  const propertyId = usePropertyId()
  const invalidate = useInvalidate(['accounting-ap', 'accounting-vendors', 'accounting-coa'])
  const [vendorName, setVendorName] = useState('')

  const vendors = useQuery({
    queryKey: ['accounting-vendors'],
    queryFn: async () => (await api.get<Vendor[]>('/api/accounting/vendors')).data,
  })
  const accounts = useQuery({
    queryKey: ['accounting-coa'],
    queryFn: async () => (await api.get<Account[]>('/api/accounting/coa')).data,
  })
  const invoices = useQuery({
    queryKey: ['accounting-ap', propertyId],
    queryFn: async () =>
      (
        await api.get<Invoice[]>(
          `/api/accounting/ap-invoices?horizontalPropertyId=${encodeURIComponent(propertyId)}`,
        )
      ).data,
  })

  const form = useForm({
    initialValues: {
      vendorId: '',
      expenseAccountId: '',
      invoiceNumber: '',
      subtotal: 0,
    },
  })

  const createVendor = useMutation({
    mutationFn: async () => (await api.post('/api/accounting/vendors', { name: vendorName })).data,
    onSuccess: () => {
      notifications.show({ color: 'green', message: 'Proveedor creado' })
      setVendorName('')
      void invalidate()
    },
    onError: (e) => notifications.show({ color: 'red', message: getApiErrorMessage(e) }),
  })

  const createInvoice = useMutation({
    mutationFn: async () => {
      if (!ApInvoiceForm_RequiresVendor(form.values.vendorId)) {
        throw new Error('El proveedor es obligatorio.')
      }
      return (
        await api.post('/api/accounting/ap-invoices', {
          horizontalPropertyId: propertyId,
          vendorId: form.values.vendorId,
          expenseAccountId: form.values.expenseAccountId,
          invoiceNumber: form.values.invoiceNumber,
          issueDate: new Date().toISOString(),
          subtotal: form.values.subtotal,
        })
      ).data
    },
    onSuccess: () => {
      notifications.show({ color: 'green', message: 'Factura registrada' })
      form.reset()
      void invalidate()
    },
    onError: (e) => notifications.show({ color: 'red', message: getApiErrorMessage(e) }),
  })

  const expenseOptions =
    accounts.data
      ?.filter((a) => a.isPostable && a.code.startsWith('5'))
      .map((a) => ({ value: a.id, label: `${a.code} — ${a.name}` })) ?? []

  return (
    <Stack gap="md">
      <PageHeader title="Cuentas por pagar" description="Proveedores, facturas y pagos a terceros." />
      <Stack gap="xs">
        <Text fw={600}>Nuevo proveedor</Text>
        <TextInput label="Nombre" value={vendorName} onChange={(e) => setVendorName(e.currentTarget.value)} />
        <Button w={180} onClick={() => createVendor.mutate()} loading={createVendor.isPending}>
          Crear proveedor
        </Button>
      </Stack>
      <Stack gap="xs">
        <Text fw={600}>Nueva factura</Text>
        <Select
          label="Proveedor"
          data={(vendors.data ?? []).map((v) => ({ value: v.id, label: v.name }))}
          {...form.getInputProps('vendorId')}
          searchable
        />
        <Select label="Cuenta de gasto" data={expenseOptions} {...form.getInputProps('expenseAccountId')} searchable />
        <TextInput label="Número" {...form.getInputProps('invoiceNumber')} />
        <NumberInput label="Subtotal" min={0} decimalScale={2} {...form.getInputProps('subtotal')} />
        <Button
          w={200}
          onClick={() => createInvoice.mutate()}
          loading={createInvoice.isPending}
          disabled={!ApInvoiceForm_RequiresVendor(form.values.vendorId)}
        >
          Registrar factura
        </Button>
      </Stack>
      <Table striped>
        <Table.Thead>
          <Table.Tr>
            <Table.Th>Factura</Table.Th>
            <Table.Th>Proveedor</Table.Th>
            <Table.Th>Total</Table.Th>
            <Table.Th>Saldo</Table.Th>
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>
          {(invoices.data ?? []).map((i) => (
            <Table.Tr key={i.id}>
              <Table.Td>{i.invoiceNumber}</Table.Td>
              <Table.Td>{i.vendorName}</Table.Td>
              <Table.Td>{formatMoney(i.total)}</Table.Td>
              <Table.Td>{formatMoney(i.balance)}</Table.Td>
            </Table.Tr>
          ))}
        </Table.Tbody>
      </Table>
    </Stack>
  )
}
