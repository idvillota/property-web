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
        title="Platform status"
        description="Platform administrator readiness check for Property."
      />

      <Paper withBorder p="md" radius="md">
        <Stack gap="sm">
          <Text size="sm" c="dimmed">
            GET /api/platform/tenants/status
          </Text>

          {statusQuery.isLoading ? (
            <Text size="sm" c="dimmed">
              Checking platform status…
            </Text>
          ) : statusQuery.isError ? (
            <Alert color="red" variant="light" title="Platform check failed" icon={<IconServer size={16} />}>
              {getApiErrorMessage(statusQuery.error)}
            </Alert>
          ) : (
            <Stack gap="xs">
              <Badge color={ready ? 'teal' : 'gray'} variant="light" w="fit-content">
                {status ?? 'unknown'}
              </Badge>
              <Text size="sm">
                {ready ? 'Platform admin ready.' : 'Platform admin responded with a non-ready status.'}
              </Text>
            </Stack>
          )}
        </Stack>
      </Paper>
    </Stack>
  )
}
