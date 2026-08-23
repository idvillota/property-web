import { Alert, Button, Group, Loader, Stack, Text, Title } from '@mantine/core'
import { notifications } from '@mantine/notifications'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Link, useSearchParams } from 'react-router-dom'
import { api } from '../../../api/client'
import { getApiErrorMessage } from '../../../api/errors'
import type { PaymentIntent } from '../../../api/types'
import { formatMoney } from '../../../lib/money'
import { FeatureCodes } from '../../../lib/permissions'
import { useAuthStore } from '../../../stores/authStore'

function statusLabel(status: string | number) {
  const s = String(status)
  if (s === '2' || s === 'Paid') return 'Pagado'
  if (s === '3' || s === 'Failed') return 'Fallido'
  if (s === '1' || s === 'RequiresAction') return 'Pendiente de confirmación'
  if (s === '4' || s === 'Cancelled') return 'Cancelado'
  return 'Pendiente'
}

export function PortalPayResultPage() {
  const [params] = useSearchParams()
  const intentId = params.get('intentId')
  const hasPay = useAuthStore((s) => s.hasPermission(FeatureCodes.portalPay))
  const queryClient = useQueryClient()

  const intentQuery = useQuery({
    queryKey: ['portalPaymentIntent', intentId],
    enabled: hasPay && !!intentId,
    refetchInterval: (q) => {
      const status = String(q.state.data?.status ?? '')
      return status === 'Paid' || status === '2' || status === 'Failed' || status === '3' ? false : 4000
    },
    queryFn: async () => {
      const { data } = await api.get<PaymentIntent>(`/api/portal/pagos/intents/${intentId}`)
      return data
    },
  })

  const confirmMutation = useMutation({
    mutationFn: async () => {
      const { data } = await api.post<PaymentIntent>(
        `/api/portal/pagos/intents/${intentId}/sandbox-confirm`,
      )
      return data
    },
    onSuccess: () => {
      notifications.show({ title: 'Pago confirmado', message: 'Saldo actualizado', color: 'teal' })
      void queryClient.invalidateQueries({ queryKey: ['portalPaymentIntent', intentId] })
      void queryClient.invalidateQueries({ queryKey: ['portalAccount'] })
    },
    onError: (err) =>
      notifications.show({ title: 'Error', message: getApiErrorMessage(err), color: 'red' }),
  })

  if (!hasPay) {
    return (
      <Alert color="orange" title="Sin permiso">
        No tienes permiso para pagar en línea.
      </Alert>
    )
  }

  if (!intentId) {
    return (
      <Alert color="red" title="Falta intentId">
        Vuelve a iniciar el pago desde la pantalla Pagar.
      </Alert>
    )
  }

  if (intentQuery.isLoading) {
    return (
      <Stack align="center" py="xl">
        <Loader color="teal" />
        <Text c="dimmed" size="sm">
          Confirmando pago…
        </Text>
      </Stack>
    )
  }

  if (intentQuery.isError) {
    return (
      <Alert color="red" title="No se pudo consultar el pago">
        {getApiErrorMessage(intentQuery.error)}
      </Alert>
    )
  }

  const intent = intentQuery.data!
  const paid = String(intent.status) === 'Paid' || String(intent.status) === '2'
  const failed = String(intent.status) === 'Failed' || String(intent.status) === '3'
  const isMock = (intent.providerRef ?? '').startsWith('wompi-mock-')

  return (
    <Stack gap="lg" maw={480}>
      <Title order={2} style={{ fontFamily: 'Fraunces, Georgia, serif' }}>
        Resultado del pago
      </Title>
      <Text>
        Estado: <strong>{statusLabel(intent.status)}</strong>
      </Text>
      <Text size="sm" c="dimmed">
        Monto {formatMoney(intent.amount)} · {intent.provider} · ref {intent.providerRef ?? '—'}
      </Text>

      {paid ? (
        <Alert color="teal" title="Pago exitoso">
          El cargo quedó aplicado. Puedes revisar tu estado de cuenta.
        </Alert>
      ) : null}
      {failed ? (
        <Alert color="red" title="Pago no aprobado">
          {intent.failureReason ?? 'El proveedor rechazó la transacción.'}
        </Alert>
      ) : null}

      {!paid && !failed && isMock ? (
        <Button loading={confirmMutation.isPending} onClick={() => confirmMutation.mutate()}>
          Confirmar pago (sandbox mock)
        </Button>
      ) : null}

      {!paid && !failed && !isMock ? (
        <Text size="sm" c="dimmed">
          Esperando confirmación del webhook Wompi… esta pantalla se actualiza sola.
        </Text>
      ) : null}

      <Group>
        <Button component={Link} to="/portal/cuenta" variant="default">
          Ver cuenta
        </Button>
        <Button component={Link} to="/portal/cuenta/pagar" variant="light">
          Otro pago
        </Button>
      </Group>
    </Stack>
  )
}
