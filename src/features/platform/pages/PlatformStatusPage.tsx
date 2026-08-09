import { Alert, Badge, Paper, Stack, Text } from '@mantine/core'
import { IconServer } from '@tabler/icons-react'
import { useQuery } from '@tanstack/react-query'
import { getApiErrorMessage } from '../../../api/errors'
import { getPlatformTenantsStatus } from '../../../api/platform'
import { PageHeader } from '../../../components/shared/PageHeader'

export function PlatformStatusPage() {
  const statusQuery = useQuery({
    queryKey: ['platform', 'tenants', 'status'],
    queryFn: getPlatformTenantsStatus,
  })

  const status = statusQuery.data?.status
  const ready = status?.toLowerCase() === 'ready'

  return (
    <Stack gap="lg" maw={640}>
      <PageHeader
        title="Estado de la plataforma"
        description="Verificación de disponibilidad para administradores de plataforma."
      />

      <Paper withBorder p="md" radius="md">
        <Stack gap="sm">
          <Text size="sm" c="dimmed">
            GET /api/platform/tenants/status
          </Text>

          {statusQuery.isLoading ? (
            <Text size="sm" c="dimmed">
              Consultando estado de la plataforma…
            </Text>
          ) : statusQuery.isError ? (
            <Alert color="red" variant="light" title="Error al consultar la plataforma" icon={<IconServer size={16} />}>
              {getApiErrorMessage(statusQuery.error)}
            </Alert>
          ) : (
            <Stack gap="xs">
              <Badge color={ready ? 'teal' : 'gray'} variant="light" w="fit-content">
                {status ?? 'desconocido'}
              </Badge>
              <Text size="sm">
                {ready
                  ? 'Administrador de plataforma listo.'
                  : 'La plataforma respondió con un estado distinto de listo.'}
              </Text>
            </Stack>
          )}
        </Stack>
      </Paper>
    </Stack>
  )
}
