import { Anchor, Alert, Loader, Stack, Text } from '@mantine/core'
import { useQuery } from '@tanstack/react-query'
import { Link, Outlet } from 'react-router-dom'
import { api } from '../../../api/client'
import type { HorizontalProperty } from '../../../api/types'
import { PageHeader } from '../../../components/shared/PageHeader'
import { usePropertyId } from '../../../hooks/usePropertyId'
import { PropertySubnav } from '../components/PropertySubnav'

export function PropertyWorkspaceLayout() {
  const propertyId = usePropertyId()

  const propertyQuery = useQuery({
    queryKey: ['horizontal-property', propertyId],
    queryFn: async () => {
      const { data } = await api.get<HorizontalProperty>(`/api/HorizontalProperties/${propertyId}`)
      return data
    },
  })

  if (propertyQuery.isLoading) {
    return (
      <Stack align="center" py="xl">
        <Loader />
      </Stack>
    )
  }

  if (propertyQuery.isError || !propertyQuery.data) {
    return (
      <Alert color="red" title="Property not found">
        Could not load this property.{' '}
        <Anchor component={Link} to="/properties">
          Back to properties
        </Anchor>
      </Alert>
    )
  }

  const property = propertyQuery.data

  return (
    <Stack gap="md">
      <PageHeader
        title={property.name}
        description={
          <>
            <Anchor component={Link} to="/properties" size="sm">
              Properties
            </Anchor>
            <Text span size="sm" c="dimmed">
              {' / '}
              {property.tradeName ?? property.city}
            </Text>
          </>
        }
      />
      <PropertySubnav propertyId={propertyId} />
      <Outlet context={{ property }} />
    </Stack>
  )
}

export type PropertyWorkspaceContext = {
  property: HorizontalProperty
}
