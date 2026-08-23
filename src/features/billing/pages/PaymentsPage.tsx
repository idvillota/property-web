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
import { useBuildingById } from '../../../hooks/useBuildingById'
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
import { toDwellingUnitSelectOptions } from '../../../lib/unitLabels'
import { paymentsPageShowsValidationOnEmptyAmount } from '../lib/paymentsPageShowsValidationOnEmptyAmount'

type AllocRow = { feeChargeId: string; amount: number; label: string; balance: number }

export function PaymentsPage() {
  const propertyId = usePropertyId()
  const [drawer, setDrawer] = useState(false)
  const [autoAllocate, setAutoAllocate] = useState(true)
  const [allowOverpayment, setAllowOverpayment] = useState(false)
  const [allocations, setAllocations] = useState<AllocRow[]>([])
  const [lastUnitBalance, setLastUnitBalance] = useState<number | null>(null)
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
  const { buildingById } = useBuildingById(propertyId)
  const unitOptions = useMemo(
    () => toDwellingUnitSelectOptions(units.data ?? [], buildingById),
    [units.data, buildingById],
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
      unitId: (v) => (!v ? 'Obligatorio' : null),
      amount: (v) => paymentsPageShowsValidationOnEmptyAmount(v),
      method: (v) => (!v ? 'Obligatorio' : null),
      paidAt: (v) => (!v ? 'Obligatorio' : null),
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

  const unitOpenBalance = useMemo(() => {
    const charges = pendingChargesQuery.data
    if (!charges) return null
    return Math.round(charges.reduce((sum, c) => sum + chargeBalance(c.amount, c.amountPaid), 0) * 100) / 100
  }, [pendingChargesQuery.data])

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
          label: `${c.dueDate} · ${labelForOption(FEE_CHARGE_TYPE_OPTIONS, c.chargeType)} · saldo ${formatMoney(balance)}`,
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
    setAllowOverpayment(false)
    setLastUnitBalance(null)
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
      const roundedAmount = Math.round(amount * 100) / 100
      if (!allowOverpayment && sum !== roundedAmount) {
        throw new Error(
          `Las asignaciones (${formatMoney(sum)}) deben igualar el valor del pago (${formatMoney(amount)})`,
        )
      }
      if (allowOverpayment && sum > roundedAmount) {
        throw new Error(
          `Las asignaciones (${formatMoney(sum)}) no pueden superar el valor del pago (${formatMoney(amount)})`,
        )
      }
      if (activeAllocations.length === 0) {
        throw new Error('Seleccione al menos un cargo a aplicar.')
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
        allowOverpayment,
        allocations: activeAllocations,
      })
      return data
    },
    onSuccess: (data) => {
      const remaining = data.unitOpenBalanceAfter ?? 0
      setLastUnitBalance(remaining)
      notifications.show({
        title: 'Pago registrado',
        message: `Saldo restante de la unidad: ${formatMoney(remaining)}`,
        color: 'teal',
      })
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
        title: 'Desactivado',
        message: 'Pago anulado y desactivado',
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
        header: 'Unidad',
        sortKey: 'unitid',
        filter: 'select',
        filterKey: 'unitId',
        filterOptions: unitOptions,
        render: (row) => row.unitCode ?? unitOptions.find((u) => u.value === row.unitId)?.label ?? '—',
      },
      {
        key: 'amount',
        header: 'Valor',
        sortKey: 'amount',
        filter: 'none',
        align: 'right',
        render: (row) => formatMoney(row.amount),
      },
      {
        key: 'paidAt',
        header: 'Fecha',
        sortKey: 'paidat',
        filter: 'none',
        render: (row) => new Date(row.paidAt).toLocaleString(),
      },
      {
        key: 'method',
        header: 'Método',
        sortKey: 'method',
        filter: 'select',
        filterKey: 'method',
        filterOptions: PAYMENT_METHOD_OPTIONS.map((o) => ({ value: o.value, label: o.label })),
        render: (row) => labelForOption(PAYMENT_METHOD_OPTIONS, row.method),
      },
      {
        key: 'allocations',
        header: 'Asignaciones',
        filter: 'none',
        render: (row) => {
          const count = row.allocations?.length ?? 0
          if (!count) return '—'
          return `${count} cargo${count === 1 ? '' : 's'}`
        },
      },
      {
        key: 'reference',
        header: 'Referencia',
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
                if (window.confirm('¿Desactivar este pago y revertir las asignaciones?')) {
                  deleteMutation.mutate(row.id)
                }
              }}
              aria-label="Desactivar"
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
        title="Pagos"
        description="Registre pagos y asígnelos a cargos de cuota abiertos."
      />
      {lastUnitBalance != null ? (
        <Text size="sm" c="dimmed">
          Último saldo restante de unidad tras guardar: {formatMoney(lastUnitBalance)}
        </Text>
      ) : null}
      <ListToolbar
        onAdd={openCreate}
        addLabel="Registrar pago"
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
            subtitle={`${item.unitCode ?? 'Unidad'} · ${labelForOption(PAYMENT_METHOD_OPTIONS, item.method)}`}
            inactive={!item.isActive}
            onEdit={() => undefined}
            onDelete={() => {
              if (item.isActive && window.confirm('¿Desactivar este pago y revertir las asignaciones?')) {
                deleteMutation.mutate(item.id)
              }
            }}
          />
        )}
      />

      <FormDrawer opened={drawer} onClose={() => setDrawer(false)} title="Registrar pago">
        <form onSubmit={form.onSubmit(() => saveMutation.mutate())}>
          <Stack gap="sm">
            <Select
              label="Unidad"
              required
              searchable
              data={unitOptions}
              comboboxProps={formDrawerSelectComboboxProps}
              value={form.values.unitId}
              onChange={(v) => form.setFieldValue('unitId', v ?? '')}
              error={form.errors.unitId}
            />
            <MoneyInput
              label="Valor"
              precision={2}
              required
              {...form.getInputProps('amount')}
            />
            {unitOpenBalance != null ? (
              <Text size="sm" c="dimmed">
                Saldo abierto de la unidad: {formatMoney(unitOpenBalance)}
              </Text>
            ) : null}
            <Select
              label="Método"
              required
              data={[...PAYMENT_METHOD_OPTIONS]}
              comboboxProps={formDrawerSelectComboboxProps}
              {...form.getInputProps('method')}
            />
            <TextInput
              label="Pagado el"
              type="datetime-local"
              required
              {...form.getInputProps('paidAt')}
            />
            <TextInput label="Referencia" {...form.getInputProps('reference')} />
            <Textarea label="Notas" minRows={2} {...form.getInputProps('notes')} />

            <Switch
              label="Asignar automáticamente FIFO por vencimiento"
              checked={autoAllocate}
              onChange={(e) => setAutoAllocate(e.currentTarget.checked)}
            />
            <Switch
              label="Permitir sobrante (monto mayor al saldo abierto)"
              description="Si está desactivado, el API rechaza pagos por encima del saldo de cargos."
              checked={allowOverpayment}
              onChange={(e) => setAllowOverpayment(e.currentTarget.checked)}
            />

            {!form.values.unitId ? (
              <Text size="sm" c="dimmed">
                Seleccione una unidad para cargar los cargos pendientes.
              </Text>
            ) : pendingChargesQuery.isLoading ? (
              <Text size="sm" c="dimmed">
                Cargando cargos abiertos…
              </Text>
            ) : (pendingChargesQuery.data?.length ?? 0) === 0 ? (
              <Text size="sm" c="dimmed">
                No hay cargos pendientes o parciales para esta unidad.
              </Text>
            ) : (
              <Stack gap="xs">
                <Group justify="space-between">
                  <Text size="sm" fw={600}>
                    Cargos a aplicar
                  </Text>
                  <Text
                    size="xs"
                    c={
                      allowOverpayment
                        ? allocationSum <= Number(form.values.amount)
                          ? 'teal'
                          : 'orange'
                        : allocationSum === Number(form.values.amount)
                          ? 'teal'
                          : 'orange'
                    }
                  >
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
              Guardar pago
            </Button>
          </Stack>
        </form>
      </FormDrawer>
    </Stack>
  )
}
