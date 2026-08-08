import { Alert, Anchor, Loader, Stack } from '@mantine/core'
import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { PageHeader } from '../../../components/shared/PageHeader'
import { usePropertyId } from '../../../hooks/usePropertyId'

type Props = {
  title: string
  description?: ReactNode
  filters?: ReactNode
  loading?: boolean
  error?: string | null
  children: ReactNode
}

export function ReportPageShell({
  title,
  description,
  filters,
  loading,
  error,
  children,
}: Props) {
  const propertyId = usePropertyId()

  return (
    <Stack gap="md">
      <Anchor
        component={Link}
        to={`/properties/${propertyId}/reports`}
        size="sm"
        underline="hover"
      >
        ← Reports
      </Anchor>
      <PageHeader title={title} description={description} />
      {filters}
      {loading ? <Loader size="sm" /> : null}
      {error ? (
        <Alert color="red" title="Could not load report">
          {error}
        </Alert>
      ) : null}
      {!loading && !error ? children : null}
    </Stack>
  )
}
