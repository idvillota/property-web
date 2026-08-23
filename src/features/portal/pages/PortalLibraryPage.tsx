import { Alert, Button, Loader, Stack, Text, Title } from '@mantine/core'
import { useQuery } from '@tanstack/react-query'
import { api } from '../../../api/client'
import { getApiErrorMessage } from '../../../api/errors'
import { useAuthStore } from '../../../stores/authStore'
import { useCurrentProperty } from '../../../hooks/useCurrentProperty'
import { LibraryPage_DownloadButton } from '../../community/lib/libraryPageDownloadButton'

type LibraryDoc = {
  id: string
  title: string
  fileAssetId: string
}

export function PortalLibraryPage() {
  const propertyQuery = useCurrentProperty()
  const propertyId = propertyQuery.data?.id
  const isOwner = useAuthStore((s) => s.roles.includes('Owner'))

  const query = useQuery({
    queryKey: ['portal-library', propertyId],
    enabled: Boolean(propertyId),
    queryFn: async () => {
      const { data } = await api.get<LibraryDoc[]>('/api/library/portal', {
        params: { horizontalPropertyId: propertyId, isOwner },
      })
      return data
    },
  })

  if (propertyQuery.isLoading) {
    return <Loader size="sm" />
  }

  if (!propertyId) {
    return (
      <Alert color="orange" title="Sin propiedad">
        No hay propiedad horizontal vinculada.
      </Alert>
    )
  }

  return (
    <Stack gap="md">
      <Title order={3}>Biblioteca</Title>
      {query.isLoading ? <Loader size="sm" /> : null}
      {query.isError ? <Text c="red">{getApiErrorMessage(query.error)}</Text> : null}
      {(query.data ?? []).map((doc) => (
        <Stack key={doc.id} gap={4}>
          <Text>{doc.title}</Text>
          {LibraryPage_DownloadButton(doc.fileAssetId) ? (
            <Button component="a" href={`/api/files/${doc.fileAssetId}`} target="_blank" rel="noreferrer" size="xs">
              Descargar
            </Button>
          ) : null}
        </Stack>
      ))}
    </Stack>
  )
}
