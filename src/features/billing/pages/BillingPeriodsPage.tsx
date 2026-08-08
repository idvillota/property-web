import {
  ActionIcon,
  Button,
  Group,
  Select,
  Stack,
  Text,
  Textarea,
  Tooltip,
} from '@mantine/core'
import { useForm } from '@mantine/form'
import { notifications } from '@mantine/notifications'
import { IconLock, IconReceipt2 } from '@tabler/icons-react'
import { useMutation } from '@tanstack/react-query'
import { useEffect, useMemo, useState } from 'react'
import { api } from '../../../api/client'
import { getApiErrorMessage } from '../../../api/errors'
import type { BillingPeriod, GenerateChargesResult } from '../../../api/types'
import { EntityCard } from '../../../components/crud/EntityCard'
import { FormDrawer } from '../../../components/crud/FormDrawer'
import { ListToolbar } from '../../../components/crud/ListToolbar'
import { PagedEntityView } from '../../../components/data-table/PagedEntityView'
import type { ColumnDef } from '../../../components/data-table/types'
import { PageHeader } from '../../../components/shared/PageHeader'
import { StatusBadge } from '../../../components/shared/StatusBadge'
import { useInvalidate } from '../../../hooks/useInvalidate'
import { usePagedListQuery } from '../../../hooks/usePagedListQuery'
import { usePagedListState } from '../../../hooks/usePagedListState'
import { usePropertyId } from '../../../hooks/usePropertyId'
import {
  BILLING_PERIOD_STATUS_OPTIONS,
  asEnumName,
  enumIndex,
  labelForOption,
  MONTH_OPTIONS,
} from '../../../lib/billingEnums'
import { formDrawerSelectComboboxProps } from '../../../lib/formDrawerSelect'
import { formatMoney } from '../../../lib/money'

function yearOptions(around = new Date().getFullYear()) {
  return Array.from({ length: 7 }, (_, i) => {
    const y = around - 2 + i
    return { value: String(y), label: String(y) }
  })
}

function isOpenPeriod(status: string | number) {
  return asEnumName(status, BILLING_PERIOD_STATUS_OPTIONS) === 'Open'
}

export function BillingPeriodsPage() {
  const propertyId = usePropertyId()
  const [drawer, setDrawer] = useState<'create' | BillingPeriod | null>(null)
  const invalidate = useInvalidate(['billing-periods', 'billing-period-options', 'fee-charges'])
  const list = usePagedListState('year', {
    sortDir: 'desc',
    columnFilters: { horizontalPropertyId: propertyId },
  })
  const listQuery = usePagedListQuery<BillingPeriod>('billing-periods', '/api/BillingPeriods', list)

  useEffect(() => {
    list.setFilter('horizontalPropertyId', propertyId)
  }, [propertyId, list.setFilter])

  const now = new Date()
  const form = useForm({
    initialValues: {
      year: String(now.getFullYear()),
      month: String(now.getMonth() + 1),
      notes: '',
      status: 'Open',
    },
    validate: {
      year: (v) => (!v ? 'Required' : null),
      month: (v) => (!v ? 'Required' : null),
    },
  })

  const openCreate = () => {
    form.setValues({
      year: String(now.getFullYear()),
      month: String(now.getMonth() + 1),
      notes: '',
      status: 'Open',
    })
    setDrawer('create')
  }

  const openEdit = (item: BillingPeriod) => {
    form.setValues({
      year: String(item.year),
      month: String(item.month),
      notes: item.notes ?? '',
      status: asEnumName(item.status, BILLING_PERIOD_STATUS_OPTIONS) || 'Open',
    })
    setDrawer(item)
  }

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (drawer === 'create') {
        const { data } = await api.post<BillingPeriod>('/api/BillingPeriods', {
          horizontalPropertyId: propertyId,
          year: Number(form.values.year),
          month: Number(form.values.month),
          notes: form.values.notes.trim() || null,
        })
        return data
      }
      const { data } = await api.put<BillingPeriod>(`/api/BillingPeriods/${drawer!.id}`, {
        notes: form.values.notes.trim() || null,
        status: enumIndex(form.values.status, BILLING_PERIOD_STATUS_OPTIONS),
      })
      return data
    },
    onSuccess: () => {
      notifications.show({ title: 'Saved', message: 'Billing period saved', color: 'teal' })
      setDrawer(null)
      invalidate()
    },
    onError: (err) =>
      notifications.show({ title: 'Error', message: getApiErrorMessage(err), color: 'red' }),
  })

  const closeMutation = useMutation({
    mutationFn: async (item: BillingPeriod) => {
      const { data } = await api.put<BillingPeriod>(`/api/BillingPeriods/${item.id}`, {
        notes: item.notes,
        status: enumIndex('Closed', BILLING_PERIOD_STATUS_OPTIONS),
      })
      return data
    },
    onSuccess: () => {
      notifications.show({ title: 'Closed', message: 'Period closed', color: 'teal' })
      invalidate()
    },
    onError: (err) =>
      notifications.show({ title: 'Error', message: getApiErrorMessage(err), color: 'red' }),
  })

  const softCloseMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/api/BillingPeriods/${id}`),
    onSuccess: () => {
      notifications.show({ title: 'Closed', message: 'Period closed', color: 'gray' })
      invalidate()
    },
    onError: (err) =>
      notifications.show({ title: 'Error', message: getApiErrorMessage(err), color: 'red' }),
  })

  const generateMutation = useMutation({
    mutationFn: async (billingPeriodId: string) => {
      const { data } = await api.post<GenerateChargesResult>('/api/FeeCharges/generate-ordinary', {
        horizontalPropertyId: propertyId,
        billingPeriodId,
      })
      return data
    },
    onSuccess: (result) => {
      notifications.show({
        title: 'Ordinary charges generated',
        message: `Created ${result.createdCount}, skipped ${result.skippedCount}, total ${formatMoney(result.totalAmount)}`,
        color: 'teal',
      })
      invalidate()
    },
    onError: (err) =>
      notifications.show({ title: 'Error', message: getApiErrorMessage(err), color: 'red' }),
  })

  const columns = useMemo((): ColumnDef<BillingPeriod>[] => {
    return [
      {
        key: 'periodKey',
        header: 'Period',
        sortKey: 'year',
        filter: 'none',
        render: (row) => (
          <Text size="sm" fw={500}>
            {row.periodKey}
          </Text>
        ),
      },
      {
        key: 'status',
        header: 'Status',
        sortKey: 'status',
        filter: 'select',
        filterKey: 'status',
        filterOptions: BILLING_PERIOD_STATUS_OPTIONS.map((o) => ({
          value: o.value,
          label: o.label,
        })),
        render: (row) => (
          <StatusBadge
            variant={isOpenPeriod(row.status) ? 'success' : 'neutral'}
            label={labelForOption(BILLING_PERIOD_STATUS_OPTIONS, row.status)}
          />
        ),
      },
      {
        key: 'notes',
        header: 'Notes',
        filter: 'none',
        render: (row) => row.notes || '—',
      },
      {
        key: 'actions',
        header: '',
        filter: 'none',
        width: 140,
        render: (row) => (
          <Group gap={4} wrap="nowrap">
            {isOpenPeriod(row.status) ? (
              <Tooltip label="Generate ordinary charges">
                <ActionIcon
                  variant="light"
                  color="teal"
                  size="md"
                  loading={generateMutation.isPending}
                  onClick={() => {
                    if (
                      window.confirm(
                        `Generate ordinary charges for ${row.periodKey}? Existing ordinary charges for units will be skipped.`,
                      )
                    ) {
                      generateMutation.mutate(row.id)
                    }
                  }}
                  aria-label="Generate ordinary charges"
                >
                  <IconReceipt2 size={16} stroke={1.75} />
                </ActionIcon>
              </Tooltip>
            ) : null}
            {isOpenPeriod(row.status) ? (
              <Tooltip label="Close period">
                <ActionIcon
                  variant="light"
                  color="orange"
                  size="md"
                  onClick={() => {
                    if (window.confirm(`Close period ${row.periodKey}?`)) {
                      closeMutation.mutate(row)
                    }
                  }}
                  aria-label="Close period"
                >
                  <IconLock size={16} stroke={1.75} />
                </ActionIcon>
              </Tooltip>
            ) : null}
            <ActionIcon variant="light" size="md" onClick={() => openEdit(row)} aria-label="Edit">
              ✎
            </ActionIcon>
            {isOpenPeriod(row.status) ? (
              <ActionIcon
                variant="light"
                color="red"
                size="md"
                onClick={() => {
                  if (window.confirm(`Close period ${row.periodKey}?`)) {
                    softCloseMutation.mutate(row.id)
                  }
                }}
                aria-label="Close"
              >
                ✕
              </ActionIcon>
            ) : null}
          </Group>
        ),
      },
    ]
  }, [closeMutation, generateMutation, softCloseMutation])

  return (
    <Stack gap="md">
      <PageHeader
        title="Billing periods"
        description="Open and close monthly periods, then generate ordinary charges."
      />
      <ListToolbar onAdd={openCreate} addLabel="Add period" />
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
            title={item.periodKey}
            subtitle={labelForOption(BILLING_PERIOD_STATUS_OPTIONS, item.status)}
            onEdit={() => openEdit(item)}
            onDelete={() => {
              if (isOpenPeriod(item.status) && window.confirm(`Close period ${item.periodKey}?`)) {
                softCloseMutation.mutate(item.id)
              }
            }}
          />
        )}
      />

      <FormDrawer
        opened={drawer !== null}
        onClose={() => setDrawer(null)}
        title={drawer === 'create' ? 'New billing period' : 'Edit billing period'}
      >
        <form onSubmit={form.onSubmit(() => saveMutation.mutate())}>
          <Stack gap="sm">
            {drawer === 'create' ? (
              <>
                <Select
                  label="Year"
                  required
                  data={yearOptions()}
                  comboboxProps={formDrawerSelectComboboxProps}
                  {...form.getInputProps('year')}
                />
                <Select
                  label="Month"
                  required
                  data={[...MONTH_OPTIONS]}
                  comboboxProps={formDrawerSelectComboboxProps}
                  {...form.getInputProps('month')}
                />
              </>
            ) : (
              <>
                <Text size="sm" c="dimmed">
                  Period {drawer?.periodKey}
                </Text>
                <Select
                  label="Status"
                  data={[...BILLING_PERIOD_STATUS_OPTIONS]}
                  comboboxProps={formDrawerSelectComboboxProps}
                  {...form.getInputProps('status')}
                />
              </>
            )}
            <Textarea label="Notes" minRows={2} {...form.getInputProps('notes')} />
            <Button type="submit" fullWidth loading={saveMutation.isPending}>
              Save
            </Button>
          </Stack>
        </form>
      </FormDrawer>
    </Stack>
  )
}
