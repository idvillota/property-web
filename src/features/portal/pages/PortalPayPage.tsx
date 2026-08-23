import { Alert, Button, Group, Loader, Select, Stack, Text, Title } from '@mantine/core'
import { notifications } from '@mantine/notifications'
import { useMutation, useQuery } from '@tanstack/react-query'
import { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { api } from '../../../api/client'
import { getApiErrorMessage } from '../../../api/errors'
import type { PortalAccount, PortalCheckout } from '../../../api/types'
import { formatMoney } from '../../../lib/money'
import { FeatureCodes } from '../../../lib/permissions'
import { useAuthStore } from '../../../stores/authStore'
import { portalPayButtonDisabledWhenNoBalance } from '../lib/portalPayButtonDisabledWhenNoBalance'

export function PortalPayPage() {
  const navigate = useNavigate()
  const hasPay = useAuthStore((s) => s.hasPermission(FeatureCodes.portalPay))
  const digitalPayments = useAuthStore((s) => s.modules.digitalPayments)
  const [unitId, setUnitId] = useState<string | null>(null)

  const accountQuery = useQuery({
    queryKey: ['portalAccount'],
    enabled: hasPay,
    queryFn: async () => {
      const { data } = await api.get<PortalAccount>('/api/portal/cuenta')
      return data
    },
  })

  const selectedBalance = useMemo(() => {
    if (!accountQuery.data || !unitId) return accountQuery.data?.openBalance ?? 0
    return accountQuery.data.units.find((u) => u.unitId === unitId)?.openBalance ?? 0
  }, [accountQuery.data, unitId])

  const payDisabled = portalPayButtonDisabledWhenNoBalance(selectedBalance)

  const startMutation = useMutation({
    mutationFn: async () => {
      if (!unitId) throw new Error('Seleccione una unidad')
      const { data } = await api.post<PortalCheckout>('/api/portal/pagos/iniciar', { unitId })
      return data
    },
    onSuccess: (data) => {
      notifications.show({
        title: 'Checkout PSE',
        message: data.isMockCheckout
          ? 'Sandbox mock: confirme el pago en la siguiente pantalla'
          : 'Redirigiendo a Wompi…',
        color: 'teal',
      })
      navigate(`/portal/cuenta/pagar/resultado?intentId=${data.intent.id}`)
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

  if (!digitalPayments) {
    return (
      <Alert color="orange" title="Pagos digitales desactivados">
        El administrador del conjunto debe activar el módulo de pagos digitales.
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
  const unitOptions = account.units.map((u) => ({
    value: u.unitId,
    label: `${u.code} · ${formatMoney(u.openBalance)}`,
  }))

  return (
    <Stack gap="lg" maw={480}>
      <Group justify="space-between" align="flex-start">
        <Stack gap={4}>
          <Title order={2} style={{ fontFamily: 'Fraunces, Georgia, serif' }}>
            Pagar con PSE
          </Title>
          <Text c="dimmed" size="sm">
            Checkout Wompi · saldo abierto {formatMoney(account.openBalance)}
          </Text>
        </Stack>
        <Button component={Link} to="/portal/cuenta" variant="default" size="sm">
          Cuenta
        </Button>
      </Group>

      <Select
        label="Unidad"
        placeholder="Seleccione unidad"
        data={unitOptions}
        value={unitId}
        onChange={setUnitId}
        searchable
      />

      <Text size="sm" c="dimmed">
        Saldo a pagar: {formatMoney(selectedBalance)}
      </Text>

      <Button
        fullWidth
        disabled={payDisabled || !unitId || startMutation.isPending}
        loading={startMutation.isPending}
        onClick={() => startMutation.mutate()}
      >
        Pagar con PSE
      </Button>

      {payDisabled ? (
        <Text size="sm" c="dimmed">
          No hay saldo pendiente en la unidad seleccionada.
        </Text>
      ) : null}
    </Stack>
  )
}
