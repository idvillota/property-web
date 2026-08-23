import { Button, Loader, Stack, Table, Text } from '@mantine/core'
import { useQuery } from '@tanstack/react-query'
import { api } from '../../../api/client'
import { getApiErrorMessage } from '../../../api/errors'
import { PageHeader } from '../../../components/shared/PageHeader'
import { usePropertyId } from '../../../hooks/usePropertyId'
import { LibraryPage_DownloadButton } from '../lib/libraryPageDownloadButton'

type LibraryDoc = {
  id: string
  title: string
  category: string
  fileAssetId: string
}

export function LibraryPage() {
  const propertyId = usePropertyId()

  const query = useQuery({
    queryKey: ['library', propertyId],
    queryFn: async () => {
      const { data } = await api.get<LibraryDoc[]>('/api/library', {
        params: { horizontalPropertyId: propertyId },
      })
      return data
    },
  })

  return (
    <Stack gap="md">
      <PageHeader title="Biblioteca digital" description="Reglamento, actas y documentos." />
      {query.isLoading ? <Loader size="sm" /> : null}
      {query.isError ? <Text c="red">{getApiErrorMessage(query.error)}</Text> : null}
      <Table striped highlightOnHover>
        <Table.Thead>
          <Table.Tr>
            <Table.Th>Título</Table.Th>
            <Table.Th>Categoría</Table.Th>
            <Table.Th>Descargar</Table.Th>
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>
          {(query.data ?? []).map((doc) => (
            <Table.Tr key={doc.id}>
              <Table.Td>{doc.title}</Table.Td>
              <Table.Td>{doc.category}</Table.Td>
              <Table.Td>
                {LibraryPage_DownloadButton(doc.fileAssetId) ? (
                  <Button
                    component="a"
                    href={`/api/files/${doc.fileAssetId}`}
                    target="_blank"
                    rel="noreferrer"
                    size="xs"
                    variant="light"
                  >
                    Descargar
                  </Button>
                ) : null}
              </Table.Td>
            </Table.Tr>
          ))}
        </Table.Tbody>
      </Table>
    </Stack>
  )
}
