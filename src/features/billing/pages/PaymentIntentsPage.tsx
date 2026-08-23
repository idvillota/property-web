import { Badge, Stack, Text } from '@mantine/core'
import { useEffect, useMemo } from 'react'
import type { PaymentIntent } from '../../../api/types'
import { PagedEntityView } from '../../../components/data-table/PagedEntityView'
import type { ColumnDef } from '../../../components/data-table/types'
import { PageHeader } from '../../../components/shared/PageHeader'
import { usePagedListQuery } from '../../../hooks/usePagedListQuery'
import { usePagedListState } from '../../../hooks/usePagedListState'
import { usePropertyId } from '../../../hooks/usePropertyId'
import { formatMoney } from '../../../lib/money'

function statusLabel(status: string | number) {
  const s = String(status)
  if (s === '2' || s === 'Paid') return 'Pagado'
  if (s === '3' || s === 'Failed') return 'Fallido'
  if (s === '1' || s === 'RequiresAction') return 'Requiere acción'
  if (s === '4' || s === 'Cancelled') return 'Cancelado'
  return 'Pendiente'
}

export function PaymentIntentsPage() {
  const propertyId = usePropertyId()
  const list = usePagedListState('createdatutc', {
    sortDir: 'desc',
    columnFilters: { horizontalPropertyId: propertyId },
  })
  const listQuery = usePagedListQuery<PaymentIntent>('payment-intents', '/api/payment-intents', list)

  useEffect(() => {
    list.setFilter('horizontalPropertyId', propertyId)
  }, [propertyId, list.setFilter])

  const columns = useMemo((): ColumnDef<PaymentIntent>[] => {
    return [
      {
        key: 'created',
        header: 'Creado',
        sortKey: 'createdatutc',
        filter: 'none',
        render: (row) => new Date(row.createdAtUtc).toLocaleString(),
      },
      {
        key: 'amount',
        header: 'Monto',
        sortKey: 'amount',
        filter: 'none',
        align: 'right',
        render: (row) => formatMoney(row.amount),
      },
      {
        key: 'status',
        header: 'Estado',
        sortKey: 'status',
        filter: 'none',
        render: (row) => <Badge variant="light">{statusLabel(row.status)}</Badge>,
      },
      {
        key: 'provider',
        header: 'PSP',
        filter: 'none',
        render: (row) => row.provider || '—',
      },
      {
        key: 'providerRef',
        header: 'Referencia',
        filter: 'none',
        render: (row) => row.providerRef || '—',
      },
      {
        key: 'payment',
        header: 'Pago',
        filter: 'none',
        render: (row) => (row.paymentId ? row.paymentId.slice(0, 8) + '…' : '—'),
      },
    ]
  }, [])

  return (
    <Stack gap="md">
      <PageHeader
        title="Intents PSE"
        description="Solo lectura — intentos de pago digital (Wompi) y su conciliación."
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
          <div key={item.id}>
            <Text fw={600}>{formatMoney(item.amount)}</Text>
            <Text size="sm" c="dimmed">
              {statusLabel(item.status)} · {item.provider}
            </Text>
          </div>
        )}
      />
    </Stack>
  )
}
