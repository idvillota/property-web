import { Alert, Button, Group, Loader, Stack, Text, Title, UnstyledButton } from '@mantine/core'
import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../../../api/client'
import { getApiErrorMessage } from '../../../api/errors'
import type { PortalAccount, PortalAccountUnitDetail } from '../../../api/types'
import { FeatureCodes } from '../../../lib/permissions'
import { formatMoney } from '../../../lib/money'
import { useAuthStore } from '../../../stores/authStore'
import { portalAccountPageRendersBalances } from '../lib/portalAccountRendersBalances'
import { paymentDetailDownloadReceiptVisible } from '../../billing/lib/paymentDetailDownloadReceiptVisible'
import { notifications } from '@mantine/notifications'

async function downloadPortalReceipt(paymentId: string) {
  const { data } = await api.get<Blob>(`/api/portal/cuenta/pagos/${paymentId}/receipt`, {
    responseType: 'blob',
  })
  const url = URL.createObjectURL(data)
  const a = document.createElement('a')
  a.href = url
  a.download = `recibo-${paymentId}.pdf`
  a.click()
  URL.revokeObjectURL(url)
}

function formatPaidAt(iso: string) {
  try {
    return new Date(iso).toLocaleDateString('es-CO', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    })
  } catch {
    return iso.slice(0, 10)
  }
}

export function PortalAccountPage() {
  const hasAccountRead = useAuthStore((s) => s.hasPermission(FeatureCodes.portalAccountRead))
  const [selectedUnitId, setSelectedUnitId] = useState<string | null>(null)

  const accountQuery = useQuery({
    queryKey: ['portalAccount'],
    enabled: hasAccountRead,
    queryFn: async () => {
      const { data } = await api.get<PortalAccount>('/api/portal/cuenta')
      return data
    },
  })

  const detailQuery = useQuery({
    queryKey: ['portalAccountUnit', selectedUnitId],
    enabled: hasAccountRead && !!selectedUnitId,
    queryFn: async () => {
      const { data } = await api.get<PortalAccountUnitDetail>(
        `/api/portal/cuenta/units/${selectedUnitId}`,
      )
      return data
    },
  })

  if (!hasAccountRead) {
    return (
      <Alert color="orange" title="Sin permiso">
        No tienes permiso para ver el estado de cuenta.
      </Alert>
    )
  }

  if (accountQuery.isLoading) {
    return (
      <Stack align="center" py="xl">
        <Loader color="teal" />
      </Stack>
    )
  }

  if (accountQuery.isError) {
    return (
      <Alert color="red" title="No se pudo cargar la cuenta">
        {getApiErrorMessage(accountQuery.error)}
      </Alert>
    )
  }

  const account = accountQuery.data!
  const showBalances = portalAccountPageRendersBalances(account.units)

  return (
    <Stack gap="lg">
      <Group justify="space-between" align="flex-start">
        <Stack gap={4}>
          <Title order={2} style={{ fontFamily: 'Fraunces, Georgia, serif' }}>
            Estado de cuenta
          </Title>
          <Text c="dimmed" size="sm">
            {account.personFullName} · saldos de tus unidades
          </Text>
        </Stack>
        <Group gap="sm">
          <Button component={Link} to="/portal" variant="default" size="sm">
            Inicio
          </Button>
          <Button component={Link} to="/portal/cuenta/pagar" size="sm">
            Pagar PSE
          </Button>
        </Group>
      </Group>

      <div className="portal-unit-grid">
        <div className="portal-unit-card">
          <Text size="xs" c="dimmed">
            Saldo abierto
          </Text>
          <Text className="portal-unit-code" mt={4}>
            {formatMoney(account.openBalance)}
          </Text>
          <Text size="sm" c="dimmed" mt={6}>
            {account.openChargeCount} cargo{account.openChargeCount === 1 ? '' : 's'} · Mora{' '}
            {formatMoney(account.overdueBalance)}
          </Text>
        </div>
      </div>

      {!showBalances ? (
        <Alert color="yellow" title="Sin unidades">
          No hay unidades vinculadas para mostrar saldos.
        </Alert>
      ) : (
        <Stack gap="sm">
          <Text fw={600} size="sm">
            Por unidad
          </Text>
          <div className="portal-unit-grid">
            {account.units.map((unit, index) => (
              <UnstyledButton
                key={unit.unitId}
                className="portal-unit-card"
                style={{
                  animationDelay: `${index * 60}ms`,
                  textAlign: 'left',
                  width: '100%',
                  borderColor:
                    selectedUnitId === unit.unitId ? 'var(--mantine-color-teal-5)' : undefined,
                }}
                onClick={() =>
                  setSelectedUnitId((prev) => (prev === unit.unitId ? null : unit.unitId))
                }
              >
                <Text className="portal-unit-code">Unidad {unit.code}</Text>
                <Text size="sm" mt={6} fw={600}>
                  {formatMoney(unit.openBalance)}
                </Text>
                <Text size="xs" c="dimmed" mt={4}>
                  {unit.openChargeCount} pendiente
                  {unit.openChargeCount === 1 ? '' : 's'}
                  {unit.overdueBalance > 0 ? ` · Mora ${formatMoney(unit.overdueBalance)}` : ''}
                </Text>
              </UnstyledButton>
            ))}
          </div>
        </Stack>
      )}

      {selectedUnitId ? (
        <Stack gap="sm">
          <Text fw={600} size="sm">
            Detalle unidad {detailQuery.data?.code ?? '…'}
          </Text>
          {detailQuery.isLoading ? (
            <Loader size="sm" color="teal" />
          ) : detailQuery.isError ? (
            <Alert color="red">{getApiErrorMessage(detailQuery.error)}</Alert>
          ) : detailQuery.data ? (
            <>
              <Stack gap={6}>
                {detailQuery.data.openCharges.length === 0 ? (
                  <Text size="sm" c="dimmed">
                    Sin cargos abiertos.
                  </Text>
                ) : (
                  detailQuery.data.openCharges.map((charge) => (
                    <div key={charge.feeChargeId} className="portal-unit-card">
                      <Group justify="space-between" align="flex-start" wrap="nowrap">
                        <Stack gap={2}>
                          <Text size="sm" fw={600}>
                            {charge.periodKey ? `Periodo ${charge.periodKey}` : charge.description}
                          </Text>
                          <Text size="xs" c="dimmed">
                            Vence {charge.dueDate}
                          </Text>
                        </Stack>
                        <Text size="sm" fw={600}>
                          {formatMoney(charge.balance)}
                        </Text>
                      </Group>
                    </div>
                  ))
                )}
              </Stack>
              {detailQuery.data.recentPayments.length > 0 ? (
                <Stack gap={6}>
                  <Text fw={600} size="sm">
                    Pagos recientes
                  </Text>
                  {detailQuery.data.recentPayments.map((pay) => (
                    <Group key={pay.paymentId} justify="space-between" wrap="wrap">
                      <Text size="sm" c="dimmed">
                        {formatPaidAt(pay.paidAt)}
                      </Text>
                      <Group gap="xs">
                        <Text size="sm" fw={500}>
                          {formatMoney(pay.amount)}
                        </Text>
                        {paymentDetailDownloadReceiptVisible({
                          isActive: true,
                          hasReceipt: pay.hasReceipt ?? true,
                        }) ? (
                          <Button
                            size="compact-xs"
                            variant="light"
                            onClick={() => {
                              void downloadPortalReceipt(pay.paymentId).catch((err) =>
                                notifications.show({
                                  title: 'Error',
                                  message: getApiErrorMessage(err),
                                  color: 'red',
                                }),
                              )
                            }}
                          >
                            Recibo
                          </Button>
                        ) : null}
                      </Group>
                    </Group>
                  ))}
                </Stack>
              ) : null}
            </>
          ) : null}
        </Stack>
      ) : null}

      {!selectedUnitId && account.recentPayments.length > 0 ? (
        <Stack gap="sm">
          <Text fw={600} size="sm">
            Pagos recientes
          </Text>
          {account.recentPayments.map((pay) => (
            <Group key={pay.paymentId} justify="space-between" wrap="wrap">
              <Text size="sm" c="dimmed">
                {pay.unitCode} · {formatPaidAt(pay.paidAt)}
              </Text>
              <Group gap="xs">
                <Text size="sm" fw={500}>
                  {formatMoney(pay.amount)}
                </Text>
                <Button
                  size="compact-xs"
                  variant="light"
                  onClick={() => {
                    void downloadPortalReceipt(pay.paymentId).catch((err) =>
                      notifications.show({
                        title: 'Error',
                        message: getApiErrorMessage(err),
                        color: 'red',
                      }),
                    )
                  }}
                >
                  Recibo
                </Button>
              </Group>
            </Group>
          ))}
        </Stack>
      ) : null}
    </Stack>
  )
}
