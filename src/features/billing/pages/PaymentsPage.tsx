import {
  ActionIcon,
  Button,
  Group,
  NumberInput,
  Select,
  Stack,
  Switch,
  Text,
  TextInput,
  Textarea,
} from '@mantine/core'
import { useForm } from '@mantine/form'
import { notifications } from '@mantine/notifications'
import { useMutation, useQuery } from '@tanstack/react-query'
import { useEffect, useMemo, useState } from 'react'
import { api } from '../../../api/client'
import { getApiErrorMessage } from '../../../api/errors'
import { buildListUrl, optionsListQuery, type PagedResult } from '../../../api/paging'
import type { FeeCharge, Payment, Unit } from '../../../api/types'
import { EntityCard } from '../../../components/crud/EntityCard'
import { FormDrawer } from '../../../components/crud/FormDrawer'
import { ListToolbar } from '../../../components/crud/ListToolbar'
import { PagedEntityView } from '../../../components/data-table/PagedEntityView'
import { activeColumn } from '../../../components/data-table/tableColumns'
import type { ColumnDef } from '../../../components/data-table/types'
import { MoneyInput } from '../../../components/shared/MoneyInput'
import { PageHeader } from '../../../components/shared/PageHeader'
import { useEntityOptions } from '../../../hooks/useEntityOptions'
import { useInvalidate } from '../../../hooks/useInvalidate'
import { usePagedListQuery } from '../../../hooks/usePagedListQuery'
import { usePagedListState } from '../../../hooks/usePagedListState'
import { usePropertyId } from '../../../hooks/usePropertyId'
import {
  FEE_CHARGE_TYPE_OPTIONS,
  PAYMENT_METHOD_OPTIONS,
  chargeBalance,
  enumIndex,
  labelForOption,
  suggestFifoAllocations,
} from '../../../lib/billingEnums'
import { localInputToUtcIso, utcIsoToLocalInput } from '../../../lib/datetime'
import { formDrawerSelectComboboxProps } from '../../../lib/formDrawerSelect'
import { formatMoney } from '../../../lib/money'

type AllocRow = { feeChargeId: string; amount: number; label: string; balance: number }

export function PaymentsPage() {
  const propertyId = usePropertyId()
  const [drawer, setDrawer] = useState(false)
  const [autoAllocate, setAutoAllocate] = useState(true)
  const [allocations, setAllocations] = useState<AllocRow[]>([])
  const invalidate = useInvalidate(['payments', 'fee-charges', 'arrears-summary'])

  const list = usePagedListState('paidat', {
    sortDir: 'desc',
    columnFilters: { horizontalPropertyId: propertyId },
  })
  const listQuery = usePagedListQuery<Payment>('payments', '/api/Payments', list)

  useEffect(() => {
    list.setFilter('horizontalPropertyId', propertyId)
  }, [propertyId, list.setFilter])

  const units = useEntityOptions<Unit>('unit-options', '/api/Units', {
    horizontalPropertyId: propertyId,
  })
  const unitOptions = useMemo(
    () => (units.data ?? []).map((u) => ({ value: u.id, label: u.code })),
    [units.data],
  )

  const form = useForm({
    initialValues: {
      unitId: '',
      amount: 0,
      method: 'Transfer',
      paidAt: utcIsoToLocalInput(new Date().toISOString()),
      reference: '',
      notes: '',
    },
    validate: {
      unitId: (v) => (!v ? 'Required' : null),
      amount: (v) => (v <= 0 ? 'Must be greater than zero' : null),
      method: (v) => (!v ? 'Required' : null),
      paidAt: (v) => (!v ? 'Required' : null),
    },
  })

  const pendingChargesQuery = useQuery({
    queryKey: ['pending-charges', propertyId, form.values.unitId],
    enabled: Boolean(form.values.unitId) && drawer,
    queryFn: async () => {
      const pendingState = {
        ...optionsListQuery('duedate'),
        columnFilters: {
          horizontalPropertyId: propertyId,
          unitId: form.values.unitId,
          status: 'Pending',
        },
      }
      const partialState = {
        ...optionsListQuery('duedate'),
        columnFilters: {
          horizontalPropertyId: propertyId,
          unitId: form.values.unitId,
          status: 'Partial',
        },
      }
      const [pending, partial] = await Promise.all([
        api.get<PagedResult<FeeCharge>>(buildListUrl('/api/FeeCharges', pendingState)),
        api.get<PagedResult<FeeCharge>>(buildListUrl('/api/FeeCharges', partialState)),
      ])
      const map = new Map<string, FeeCharge>()
      for (const item of [...pending.data.items, ...partial.data.items]) {
        map.set(item.id, item)
      }
      return [...map.values()].sort((a, b) => a.dueDate.localeCompare(b.dueDate))
    },
  })

  const rebuildAllocations = (amount: number, charges: FeeCharge[], fifo: boolean) => {
    const suggested = fifo ? suggestFifoAllocations(amount, charges) : []
    setAllocations((prev) =>
      charges.map((c) => {
        const balance = chargeBalance(c.amount, c.amountPaid)
        const existing = prev.find((a) => a.feeChargeId === c.id)
        const alloc = fifo
          ? (suggested.find((s) => s.feeChargeId === c.id)?.amount ?? 0)
          : (existing?.amount ?? 0)
        return {
          feeChargeId: c.id,
          amount: alloc,
          label: `${c.dueDate} · ${labelForOption(FEE_CHARGE_TYPE_OPTIONS, c.chargeType)} · bal ${formatMoney(balance)}`,
          balance,
        }
      }),
    )
  }

  useEffect(() => {
    const charges = pendingChargesQuery.data
    if (!charges || !drawer) return
    rebuildAllocations(Number(form.values.amount) || 0, charges, autoAllocate)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pendingChargesQuery.data, form.values.amount, autoAllocate, drawer])

  const openCreate = () => {
    form.setValues({
      unitId: '',
      amount: 0,
      method: 'Transfer',
      paidAt: utcIsoToLocalInput(new Date().toISOString()),
      reference: '',
      notes: '',
    })
    setAllocations([])
    setAutoAllocate(true)
    setDrawer(true)
  }

  const allocationSum = useMemo(
    () => Math.round(allocations.reduce((sum, a) => sum + (Number(a.amount) || 0), 0) * 100) / 100,
    [allocations],
  )

  const saveMutation = useMutation({
    mutationFn: async () => {
      const amount = Number(form.values.amount) || 0
      const activeAllocations = allocations
        .filter((a) => (Number(a.amount) || 0) > 0)
        .map((a) => ({ feeChargeId: a.feeChargeId, amount: Number(a.amount) || 0 }))
      const sum = Math.round(activeAllocations.reduce((s, a) => s + a.amount, 0) * 100) / 100
      if (sum !== Math.round(amount * 100) / 100) {
        throw new Error(
          `Allocations (${formatMoney(sum)}) must equal payment amount (${formatMoney(amount)})`,
        )
      }
      const { data } = await api.post<Payment>('/api/Payments', {
        horizontalPropertyId: propertyId,
        unitId: form.values.unitId,
        personId: null,
        amount,
        paidAt: localInputToUtcIso(form.values.paidAt),
        method: enumIndex(form.values.method, PAYMENT_METHOD_OPTIONS),
        reference: form.values.reference.trim() || null,
        notes: form.values.notes.trim() || null,
        allocations: activeAllocations,
      })
      return data
    },
    onSuccess: () => {
      notifications.show({ title: 'Saved', message: 'Payment recorded', color: 'teal' })
      setDrawer(false)
      invalidate()
    },
    onError: (err) =>
      notifications.show({
        title: 'Error',
        message: err instanceof Error && !('response' in err) ? err.message : getApiErrorMessage(err),
        color: 'red',
      }),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/api/Payments/${id}`),
    onSuccess: () => {
      notifications.show({
        title: 'Deactivated',
        message: 'Payment reversed and deactivated',
        color: 'gray',
      })
      invalidate()
    },
    onError: (err) =>
      notifications.show({ title: 'Error', message: getApiErrorMessage(err), color: 'red' }),
  })

  const columns = useMemo((): ColumnDef<Payment>[] => {
    return [
      {
        key: 'unit',
        header: 'Unit',
        sortKey: 'unitid',
        filter: 'select',
        filterKey: 'unitId',
        filterOptions: unitOptions,
        render: (row) => row.unitCode ?? unitOptions.find((u) => u.value === row.unitId)?.label ?? '—',
      },
      {
        key: 'amount',
        header: 'Amount',
        sortKey: 'amount',
        filter: 'none',
        align: 'right',
        render: (row) => formatMoney(row.amount),
      },
      {
        key: 'paidAt',
        header: 'Date',
        sortKey: 'paidat',
        filter: 'none',
        render: (row) => new Date(row.paidAt).toLocaleString(),
      },
      {
        key: 'method',
        header: 'Method',
        sortKey: 'method',
        filter: 'select',
        filterKey: 'method',
        filterOptions: PAYMENT_METHOD_OPTIONS.map((o) => ({ value: o.value, label: o.label })),
        render: (row) => labelForOption(PAYMENT_METHOD_OPTIONS, row.method),
      },
      {
        key: 'allocations',
        header: 'Allocations',
        filter: 'none',
        render: (row) => {
          const count = row.allocations?.length ?? 0
          if (!count) return '—'
          return `${count} charge${count === 1 ? '' : 's'}`
        },
      },
      {
        key: 'reference',
        header: 'Reference',
        filter: 'none',
        render: (row) => row.reference || '—',
      },
      activeColumn<Payment>(),
      {
        key: 'actions',
        header: '',
        filter: 'none',
        width: 56,
        render: (row) =>
          row.isActive ? (
            <ActionIcon
              variant="light"
              color="red"
              size="md"
              onClick={() => {
                if (window.confirm('Deactivate this payment and reverse allocations?')) {
                  deleteMutation.mutate(row.id)
                }
              }}
              aria-label="Deactivate"
            >
              ✕
            </ActionIcon>
          ) : null,
      },
    ]
  }, [deleteMutation, unitOptions])

  return (
    <Stack gap="md">
      <PageHeader
        title="Payments"
        description="Record payments and allocate them to open fee charges."
      />
      <ListToolbar
        onAdd={openCreate}
        addLabel="Record payment"
        includeInactive={list.state.includeInactive}
        onIncludeInactiveChange={list.setIncludeInactive}
      />
      <PagedEntityView
        loading={listQuery.isLoading}
        data={listQuery.data}
        columns={columns}
        listState={list.state}
        onToggleSort={list.toggleSort}
        onColumnFilter={list.setColumnFilter}
        onClearColumnFilters={() => {
          list.clearColumnFilters()
          list.setFilter('horizontalPropertyId', propertyId)
        }}
        onSearchChange={list.setSearch}
        onPageChange={list.setPage}
        onPageSizeChange={list.setPageSize}
        renderCard={(item) => (
          <EntityCard
            key={item.id}
            title={formatMoney(item.amount)}
            subtitle={`${item.unitCode ?? 'Unit'} · ${labelForOption(PAYMENT_METHOD_OPTIONS, item.method)}`}
            inactive={!item.isActive}
            onEdit={() => undefined}
            onDelete={() => {
              if (item.isActive && window.confirm('Deactivate this payment and reverse allocations?')) {
                deleteMutation.mutate(item.id)
              }
            }}
          />
        )}
      />

      <FormDrawer opened={drawer} onClose={() => setDrawer(false)} title="Record payment">
        <form onSubmit={form.onSubmit(() => saveMutation.mutate())}>
          <Stack gap="sm">
            <Select
              label="Unit"
              required
              searchable
              data={unitOptions}
              comboboxProps={formDrawerSelectComboboxProps}
              value={form.values.unitId}
              onChange={(v) => form.setFieldValue('unitId', v ?? '')}
              error={form.errors.unitId}
            />
            <MoneyInput
              label="Amount"
              precision={2}
              required
              {...form.getInputProps('amount')}
            />
            <Select
              label="Method"
              required
              data={[...PAYMENT_METHOD_OPTIONS]}
              comboboxProps={formDrawerSelectComboboxProps}
              {...form.getInputProps('method')}
            />
            <TextInput
              label="Paid at"
              type="datetime-local"
              required
              {...form.getInputProps('paidAt')}
            />
            <TextInput label="Reference" {...form.getInputProps('reference')} />
            <Textarea label="Notes" minRows={2} {...form.getInputProps('notes')} />

            <Switch
              label="Auto-allocate FIFO by due date"
              checked={autoAllocate}
              onChange={(e) => setAutoAllocate(e.currentTarget.checked)}
            />

            {!form.values.unitId ? (
              <Text size="sm" c="dimmed">
                Select a unit to load pending charges.
              </Text>
            ) : pendingChargesQuery.isLoading ? (
              <Text size="sm" c="dimmed">
                Loading open charges…
              </Text>
            ) : (pendingChargesQuery.data?.length ?? 0) === 0 ? (
              <Text size="sm" c="dimmed">
                No pending or partial charges for this unit.
              </Text>
            ) : (
              <Stack gap="xs">
                <Group justify="space-between">
                  <Text size="sm" fw={600}>
                    Allocations
                  </Text>
                  <Text size="xs" c={allocationSum === Number(form.values.amount) ? 'teal' : 'orange'}>
                    {formatMoney(allocationSum)} / {formatMoney(Number(form.values.amount) || 0)}
                  </Text>
                </Group>
                {allocations.map((row) => (
                  <NumberInput
                    key={row.feeChargeId}
                    label={row.label}
                    min={0}
                    max={row.balance}
                    decimalScale={2}
                    thousandSeparator="."
                    decimalSeparator=","
                    disabled={autoAllocate}
                    value={row.amount}
                    onChange={(v) => {
                      const next = typeof v === 'number' ? v : 0
                      setAllocations((prev) =>
                        prev.map((a) =>
                          a.feeChargeId === row.feeChargeId ? { ...a, amount: next } : a,
                        ),
                      )
                    }}
                  />
                ))}
              </Stack>
            )}

            <Button type="submit" fullWidth loading={saveMutation.isPending}>
              Save payment
            </Button>
          </Stack>
        </form>
      </FormDrawer>
    </Stack>
  )
}
