import {
  ActionIcon,
  Button,
  Group,
  Select,
  SimpleGrid,
  Stack,
  Text,
  TextInput,
  Title,
  Tooltip,
} from '@mantine/core'
import { useForm } from '@mantine/form'
import { notifications } from '@mantine/notifications'
import { IconBan, IconPercentage } from '@tabler/icons-react'
import { useMutation, useQuery } from '@tanstack/react-query'
import { useEffect, useMemo, useState } from 'react'
import { api } from '../../../api/client'
import { getApiErrorMessage } from '../../../api/errors'
import type {
  ArrearsSummary,
  BillingPeriod,
  FeeCharge,
  GenerateChargesResult,
  Unit,
} from '../../../api/types'
import { EntityCard } from '../../../components/crud/EntityCard'
import { FormDrawer } from '../../../components/crud/FormDrawer'
import { ListToolbar } from '../../../components/crud/ListToolbar'
import { PagedEntityView } from '../../../components/data-table/PagedEntityView'
import type { ColumnDef } from '../../../components/data-table/types'
import { MoneyInput } from '../../../components/shared/MoneyInput'
import { PageHeader } from '../../../components/shared/PageHeader'
import { StatusBadge } from '../../../components/shared/StatusBadge'
import { useEntityOptions } from '../../../hooks/useEntityOptions'
import { useInvalidate } from '../../../hooks/useInvalidate'
import { usePagedListQuery } from '../../../hooks/usePagedListQuery'
import { usePagedListState } from '../../../hooks/usePagedListState'
import { usePropertyId } from '../../../hooks/usePropertyId'
import {
  BILLING_PERIOD_STATUS_OPTIONS,
  FEE_CHARGE_STATUS_OPTIONS,
  FEE_CHARGE_TYPE_OPTIONS,
  MANUAL_CHARGE_TYPE_OPTIONS,
  asEnumName,
  chargeBalance,
  enumIndex,
  labelForOption,
} from '../../../lib/billingEnums'
import { formDrawerSelectComboboxProps } from '../../../lib/formDrawerSelect'
import { formatMoney } from '../../../lib/money'

function statusVariant(
  status: string | number,
): 'warning' | 'success' | 'neutral' | 'danger' {
  const name = asEnumName(status, FEE_CHARGE_STATUS_OPTIONS)
  if (name === 'Paid') return 'success'
  if (name === 'Partial' || name === 'Pending') return 'warning'
  if (name === 'Waived' || name === 'Cancelled') return 'neutral'
  return 'danger'
}

export function FeeChargesPage() {
  const propertyId = usePropertyId()
  const [drawer, setDrawer] = useState<'create' | null>(null)
  const [interestPeriodId, setInterestPeriodId] = useState<string | null>(null)
  const invalidate = useInvalidate(['fee-charges', 'arrears-summary', 'payments'])

  const list = usePagedListState('duedate', {
    sortDir: 'desc',
    columnFilters: { horizontalPropertyId: propertyId },
  })
  const listQuery = usePagedListQuery<FeeCharge>('fee-charges', '/api/FeeCharges', list)

  useEffect(() => {
    list.setFilter('horizontalPropertyId', propertyId)
  }, [propertyId, list.setFilter])

  const periods = useEntityOptions<BillingPeriod>(
    'billing-period-options',
    '/api/BillingPeriods',
    { horizontalPropertyId: propertyId },
  )
  const units = useEntityOptions<Unit>('unit-options', '/api/Units', {
    horizontalPropertyId: propertyId,
  })

  const arrearsQuery = useQuery({
    queryKey: ['arrears-summary', propertyId],
    queryFn: async () => {
      const { data } = await api.get<ArrearsSummary>(
        `/api/FeeCharges/arrears-summary?horizontalPropertyId=${encodeURIComponent(propertyId)}`,
      )
      return data
    },
  })

  const periodOptions = useMemo(
    () => (periods.data ?? []).map((p) => ({ value: p.id, label: p.periodKey })),
    [periods.data],
  )
  const openPeriodOptions = useMemo(
    () =>
      (periods.data ?? [])
        .filter((p) => asEnumName(p.status, BILLING_PERIOD_STATUS_OPTIONS) === 'Open')
        .map((p) => ({ value: p.id, label: p.periodKey })),
    [periods.data],
  )
  const unitOptions = useMemo(
    () => (units.data ?? []).map((u) => ({ value: u.id, label: u.code })),
    [units.data],
  )

  const form = useForm({
    initialValues: {
      billingPeriodId: '',
      unitId: '',
      chargeType: 'Adjustment',
      description: '',
      amount: 0,
      dueDate: '',
    },
    validate: {
      billingPeriodId: (v) => (!v ? 'Required' : null),
      unitId: (v) => (!v ? 'Required' : null),
      chargeType: (v) => (!v ? 'Required' : null),
      description: (v) => (v.trim().length < 1 ? 'Required' : null),
      amount: (v) => (v <= 0 ? 'Must be greater than zero' : null),
      dueDate: (v) => (!v ? 'Required' : null),
    },
  })

  const openCreate = () => {
    const today = new Date()
    const due = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`
    form.setValues({
      billingPeriodId: openPeriodOptions[0]?.value ?? '',
      unitId: '',
      chargeType: 'Adjustment',
      description: '',
      amount: 0,
      dueDate: due,
    })
    setDrawer('create')
  }

  const saveMutation = useMutation({
    mutationFn: async () => {
      const { data } = await api.post<FeeCharge>('/api/FeeCharges', {
        horizontalPropertyId: propertyId,
        billingPeriodId: form.values.billingPeriodId,
        unitId: form.values.unitId,
        chargeType: enumIndex(form.values.chargeType, FEE_CHARGE_TYPE_OPTIONS),
        description: form.values.description.trim(),
        amount: Number(form.values.amount) || 0,
        dueDate: form.values.dueDate,
      })
      return data
    },
    onSuccess: () => {
      notifications.show({ title: 'Saved', message: 'Charge created', color: 'teal' })
      setDrawer(null)
      invalidate()
    },
    onError: (err) =>
      notifications.show({ title: 'Error', message: getApiErrorMessage(err), color: 'red' }),
  })

  const waiveMutation = useMutation({
    mutationFn: async (item: FeeCharge) => {
      const { data } = await api.put<FeeCharge>(`/api/FeeCharges/${item.id}`, {
        description: item.description,
        dueDate: item.dueDate,
        status: enumIndex('Waived', FEE_CHARGE_STATUS_OPTIONS),
      })
      return data
    },
    onSuccess: () => {
      notifications.show({ title: 'Waived', message: 'Charge waived', color: 'gray' })
      invalidate()
    },
    onError: (err) =>
      notifications.show({ title: 'Error', message: getApiErrorMessage(err), color: 'red' }),
  })

  const interestMutation = useMutation({
    mutationFn: async (billingPeriodId: string) => {
      const { data } = await api.post<GenerateChargesResult>('/api/FeeCharges/generate-interest', {
        horizontalPropertyId: propertyId,
        billingPeriodId,
      })
      return data
    },
    onSuccess: (result) => {
      notifications.show({
        title: 'Interest generated',
        message: `Created ${result.createdCount}, skipped ${result.skippedCount}, total ${formatMoney(result.totalAmount)}`,
        color: 'teal',
      })
      invalidate()
    },
    onError: (err) =>
      notifications.show({ title: 'Error', message: getApiErrorMessage(err), color: 'red' }),
  })

  const columns = useMemo((): ColumnDef<FeeCharge>[] => {
    return [
      {
        key: 'period',
        header: 'Period',
        sortKey: 'billingperiodid',
        filter: 'select',
        filterKey: 'billingPeriodId',
        filterOptions: periodOptions,
        render: (row) =>
          row.periodKey ??
          periodOptions.find((p) => p.value === row.billingPeriodId)?.label ??
          '—',
      },
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
        key: 'chargeType',
        header: 'Type',
        sortKey: 'chargetype',
        filter: 'select',
        filterKey: 'chargeType',
        filterOptions: FEE_CHARGE_TYPE_OPTIONS.map((o) => ({ value: o.value, label: o.label })),
        render: (row) => labelForOption(FEE_CHARGE_TYPE_OPTIONS, row.chargeType),
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
        key: 'amountPaid',
        header: 'Paid',
        sortKey: 'amountpaid',
        filter: 'none',
        align: 'right',
        render: (row) => formatMoney(row.amountPaid),
      },
      {
        key: 'balance',
        header: 'Balance',
        filter: 'none',
        align: 'right',
        render: (row) => formatMoney(chargeBalance(row.amount, row.amountPaid)),
      },
      {
        key: 'dueDate',
        header: 'Due date',
        sortKey: 'duedate',
        filter: 'none',
        render: (row) => row.dueDate,
      },
      {
        key: 'status',
        header: 'Status',
        sortKey: 'status',
        filter: 'select',
        filterKey: 'status',
        filterOptions: FEE_CHARGE_STATUS_OPTIONS.map((o) => ({ value: o.value, label: o.label })),
        render: (row) => (
          <StatusBadge
            variant={statusVariant(row.status)}
            label={labelForOption(FEE_CHARGE_STATUS_OPTIONS, row.status)}
          />
        ),
      },
      {
        key: 'actions',
        header: '',
        filter: 'none',
        width: 56,
        render: (row) => {
          const status = asEnumName(row.status, FEE_CHARGE_STATUS_OPTIONS)
          return status === 'Pending' || status === 'Partial' ? (
            <Tooltip label="Waive charge">
              <ActionIcon
                variant="light"
                color="gray"
                size="md"
                onClick={() => {
                  if (window.confirm(`Waive charge for ${row.unitCode ?? 'unit'}?`)) {
                    waiveMutation.mutate(row)
                  }
                }}
                aria-label="Waive"
              >
                <IconBan size={16} stroke={1.75} />
              </ActionIcon>
            </Tooltip>
          ) : null
        },
      },
    ]
  }, [periodOptions, unitOptions, waiveMutation])

  const arrears = arrearsQuery.data

  return (
    <Stack gap="md">
      <PageHeader
        title="Fee charges"
        description="Ordinary, extraordinary, interest, and adjustment charges."
        actions={
          <Group gap="xs" align="flex-end">
            <Select
              label="Interest period"
              placeholder="Open period"
              clearable
              data={openPeriodOptions}
              value={interestPeriodId}
              onChange={setInterestPeriodId}
              w={160}
            />
            <Button
              leftSection={<IconPercentage size={16} />}
              variant="light"
              disabled={!interestPeriodId}
              loading={interestMutation.isPending}
              onClick={() => {
                if (!interestPeriodId) return
                if (
                  window.confirm(
                    'Generate interest charges for overdue balances into the selected open period?',
                  )
                ) {
                  interestMutation.mutate(interestPeriodId)
                }
              }}
            >
              Generate interest
            </Button>
          </Group>
        }
      />

      <SimpleGrid cols={{ base: 1, sm: 2, md: 4 }} spacing="md">
        <Stack gap={2}>
          <Text size="xs" c="dimmed" tt="uppercase">
            Pending
          </Text>
          <Title order={4}>{arrears ? formatMoney(arrears.totalPending) : '—'}</Title>
        </Stack>
        <Stack gap={2}>
          <Text size="xs" c="dimmed" tt="uppercase">
            Partial
          </Text>
          <Title order={4}>{arrears ? formatMoney(arrears.totalPartial) : '—'}</Title>
        </Stack>
        <Stack gap={2}>
          <Text size="xs" c="dimmed" tt="uppercase">
            Overdue
          </Text>
          <Title order={4}>{arrears ? formatMoney(arrears.totalOverdue) : '—'}</Title>
        </Stack>
        <Stack gap={2}>
          <Text size="xs" c="dimmed" tt="uppercase">
            Units in arrears
          </Text>
          <Title order={4}>{arrears?.unitCountInArrears ?? '—'}</Title>
        </Stack>
      </SimpleGrid>

      <ListToolbar onAdd={openCreate} addLabel="Add charge" />
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
            title={`${item.unitCode ?? 'Unit'} · ${labelForOption(FEE_CHARGE_TYPE_OPTIONS, item.chargeType)}`}
            subtitle={`${formatMoney(item.amount)} · ${labelForOption(FEE_CHARGE_STATUS_OPTIONS, item.status)}`}
            inactive={!item.isActive}
            onEdit={() => undefined}
            onDelete={() => {
              const status = asEnumName(item.status, FEE_CHARGE_STATUS_OPTIONS)
              if (
                (status === 'Pending' || status === 'Partial') &&
                window.confirm(`Waive charge for ${item.unitCode ?? 'unit'}?`)
              ) {
                waiveMutation.mutate(item)
              }
            }}
          />
        )}
      />

      <FormDrawer opened={drawer !== null} onClose={() => setDrawer(null)} title="New charge">
        <form onSubmit={form.onSubmit(() => saveMutation.mutate())}>
          <Stack gap="sm">
            <Select
              label="Period"
              required
              searchable
              data={periodOptions}
              comboboxProps={formDrawerSelectComboboxProps}
              {...form.getInputProps('billingPeriodId')}
            />
            <Select
              label="Unit"
              required
              searchable
              data={unitOptions}
              comboboxProps={formDrawerSelectComboboxProps}
              {...form.getInputProps('unitId')}
            />
            <Select
              label="Type"
              required
              data={[...MANUAL_CHARGE_TYPE_OPTIONS]}
              comboboxProps={formDrawerSelectComboboxProps}
              {...form.getInputProps('chargeType')}
            />
            <TextInput label="Description" required {...form.getInputProps('description')} />
            <MoneyInput label="Amount" precision={2} required {...form.getInputProps('amount')} />
            <TextInput label="Due date" type="date" required {...form.getInputProps('dueDate')} />
            <Button type="submit" fullWidth loading={saveMutation.isPending}>
              Create charge
            </Button>
          </Stack>
        </form>
      </FormDrawer>
    </Stack>
  )
}
