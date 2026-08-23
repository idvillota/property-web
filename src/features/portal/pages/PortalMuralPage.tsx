import { Alert, Button, Group, Loader, Stack, Text, Title } from '@mantine/core'
import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../../../api/client'
import { getApiErrorMessage } from '../../../api/errors'
import type { MuralPost } from '../../../api/types'
import { FeatureCodes } from '../../../lib/permissions'
import { labelForOption, MURAL_CATEGORY_OPTIONS, MURAL_KIND_OPTIONS } from '../../../lib/muralEnums'
import { useAuthStore } from '../../../stores/authStore'
import { muralPageListsPosts } from '../../community/lib/muralPageListsPosts'

function formatPublished(iso: string) {
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

export function PortalMuralPage() {
  const hasRead = useAuthStore((s) => s.hasPermission(FeatureCodes.portalMuralRead))
  const [selectedId, setSelectedId] = useState<string | null>(null)

  const feedQuery = useQuery({
    queryKey: ['portalMural'],
    enabled: hasRead,
    queryFn: async () => {
      const { data } = await api.get<MuralPost[]>('/api/portal/mural')
      return data
    },
  })

  if (!hasRead) {
    return (
      <Alert color="orange" title="Sin permiso">
        No tienes permiso para ver el mural.
      </Alert>
    )
  }

  if (feedQuery.isLoading) {
    return (
      <Stack align="center" py="xl">
        <Loader color="teal" />
      </Stack>
    )
  }

  if (feedQuery.isError) {
    return (
      <Alert color="red" title="No se pudo cargar el mural">
        {getApiErrorMessage(feedQuery.error)}
      </Alert>
    )
  }

  const posts = feedQuery.data ?? []
  const listsOk = muralPageListsPosts(posts)
  const selected = posts.find((p) => p.id === selectedId) ?? null

  return (
    <Stack gap="lg">
      <Group justify="space-between" align="flex-start">
        <Stack gap={4}>
          <Title order={2} style={{ fontFamily: 'Fraunces, Georgia, serif' }}>
            Mural
          </Title>
          <Text c="dimmed" size="sm">
            Avisos activos del conjunto
            {listsOk ? ` · ${posts.length} publicado${posts.length === 1 ? '' : 's'}` : ''}
          </Text>
        </Stack>
        <Button component={Link} to="/portal" variant="default" size="sm">
          Inicio
        </Button>
      </Group>

      {posts.length === 0 ? (
        <Alert color="gray" title="Sin avisos">
          No hay publicaciones activas por ahora.
        </Alert>
      ) : (
        <Stack gap="sm">
          {posts.map((post) => (
            <button
              key={post.id}
              type="button"
              className="portal-unit-card"
              style={{
                textAlign: 'left',
                width: '100%',
                cursor: 'pointer',
                borderColor:
                  selectedId === post.id ? 'var(--mantine-color-teal-5)' : undefined,
              }}
              onClick={() => setSelectedId((prev) => (prev === post.id ? null : post.id))}
            >
              <Group justify="space-between" align="flex-start" wrap="nowrap">
                <Stack gap={2}>
                  <Text fw={600} size="sm">
                    {post.isPinned ? 'Fijado · ' : ''}
                    {post.title}
                  </Text>
                  <Text size="xs" c="dimmed">
                    {labelForOption(MURAL_KIND_OPTIONS, post.kind)} ·{' '}
                    {labelForOption(MURAL_CATEGORY_OPTIONS, post.category)} ·{' '}
                    {formatPublished(post.publishedAtUtc)}
                  </Text>
                </Stack>
              </Group>
              {selected?.id === post.id ? (
                <Stack gap={6} mt="sm">
                  <Text size="sm" style={{ whiteSpace: 'pre-wrap' }}>
                    {post.body}
                  </Text>
                  {post.authorDisplayName ? (
                    <Text size="xs" c="dimmed">
                      {post.authorDisplayName}
                      {post.areaLabel ? ` · ${post.areaLabel}` : ''}
                      {post.unitCode ? ` · Unidad ${post.unitCode}` : ''}
                    </Text>
                  ) : null}
                </Stack>
              ) : (
                <Text size="sm" c="dimmed" mt={6} lineClamp={2}>
                  {post.body}
                </Text>
              )}
            </button>
          ))}
        </Stack>
      )}
    </Stack>
  )
}
