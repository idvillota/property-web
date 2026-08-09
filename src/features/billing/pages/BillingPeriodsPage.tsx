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
      year: (v) => (!v ? 'Obligatorio' : null),
      month: (v) => (!v ? 'Obligatorio' : null),
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
      notifications.show({ title: 'Guardado', message: 'Periodo de facturación guardado', color: 'teal' })
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
      notifications.show({ title: 'Cerrado', message: 'Periodo cerrado', color: 'teal' })
      invalidate()
    },
    onError: (err) =>
      notifications.show({ title: 'Error', message: getApiErrorMessage(err), color: 'red' }),
  })

  const softCloseMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/api/BillingPeriods/${id}`),
    onSuccess: () => {
      notifications.show({ title: 'Cerrado', message: 'Periodo cerrado', color: 'gray' })
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
        title: 'Cargos ordinarios generados',
        message: `Creados ${result.createdCount}, omitidos ${result.skippedCount}, total ${formatMoney(result.totalAmount)}`,
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
        header: 'Periodo',
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
        header: 'Estado',
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
        header: 'Notas',
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
              <Tooltip label="Generar cuotas ordinarias">
                <ActionIcon
                  variant="light"
                  color="teal"
                  size="md"
                  loading={generateMutation.isPending}
                  onClick={() => {
                    if (
                      window.confirm(
                        `¿Generar cuotas ordinarias para ${row.periodKey}? Se omitirán las cuotas ordinarias existentes por unidad.`,
                      )
                    ) {
                      generateMutation.mutate(row.id)
                    }
                  }}
                  aria-label="Generar cuotas ordinarias"
                >
                  <IconReceipt2 size={16} stroke={1.75} />
                </ActionIcon>
              </Tooltip>
            ) : null}
            {isOpenPeriod(row.status) ? (
              <Tooltip label="Cerrar periodo">
                <ActionIcon
                  variant="light"
                  color="orange"
                  size="md"
                  onClick={() => {
                    if (window.confirm(`¿Cerrar periodo ${row.periodKey}?`)) {
                      closeMutation.mutate(row)
                    }
                  }}
                  aria-label="Cerrar periodo"
                >
                  <IconLock size={16} stroke={1.75} />
                </ActionIcon>
              </Tooltip>
            ) : null}
            <ActionIcon variant="light" size="md" onClick={() => openEdit(row)} aria-label="Editar">
              ✎
            </ActionIcon>
            {isOpenPeriod(row.status) ? (
              <ActionIcon
                variant="light"
                color="red"
                size="md"
                onClick={() => {
                  if (window.confirm(`¿Cerrar periodo ${row.periodKey}?`)) {
                    softCloseMutation.mutate(row.id)
                  }
                }}
                aria-label="Cerrar"
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
        title="Periodos de facturación"
        description="Abra y cierre periodos mensuales, luego genere las cuotas ordinarias."
      />
      <ListToolbar onAdd={openCreate} addLabel="Agregar periodo" />
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
              if (isOpenPeriod(item.status) && window.confirm(`¿Cerrar periodo ${item.periodKey}?`)) {
                softCloseMutation.mutate(item.id)
              }
            }}
          />
        )}
      />

      <FormDrawer
        opened={drawer !== null}
        onClose={() => setDrawer(null)}
        title={drawer === 'create' ? 'Nuevo periodo de facturación' : 'Editar periodo de facturación'}
      >
        <form onSubmit={form.onSubmit(() => saveMutation.mutate())}>
          <Stack gap="sm">
            {drawer === 'create' ? (
              <>
                <Select
                  label="Año"
                  required
                  data={yearOptions()}
                  comboboxProps={formDrawerSelectComboboxProps}
                  {...form.getInputProps('year')}
                />
                <Select
                  label="Mes"
                  required
                  data={[...MONTH_OPTIONS]}
                  comboboxProps={formDrawerSelectComboboxProps}
                  {...form.getInputProps('month')}
                />
              </>
            ) : (
              <>
                <Text size="sm" c="dimmed">
                  Periodo {drawer?.periodKey}
                </Text>
                <Select
                  label="Estado"
                  data={[...BILLING_PERIOD_STATUS_OPTIONS]}
                  comboboxProps={formDrawerSelectComboboxProps}
                  {...form.getInputProps('status')}
                />
              </>
            )}
            <Textarea label="Notas" minRows={2} {...form.getInputProps('notes')} />
            <Button type="submit" fullWidth loading={saveMutation.isPending}>
              Guardar
            </Button>
          </Stack>
        </form>
      </FormDrawer>
    </Stack>
  )
}
