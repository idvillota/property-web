import { Alert, Button, Group, SimpleGrid, Stack, Text, Title } from '@mantine/core'
import { useQuery } from '@tanstack/react-query'
import { Link, useOutletContext } from 'react-router-dom'
import { api } from '../../../api/client'
import type { CoefficientSummary, StructureComposerStatus } from '../../../api/types'
import { usePropertyId } from '../../../hooks/usePropertyId'
import { labelForOption, PROPERTY_USE_TYPE_OPTIONS } from '../../../lib/structureEnums'
import type { PropertyWorkspaceContext } from '../layouts/PropertyWorkspaceLayout'

export function PropertyOverviewPage() {
  const propertyId = usePropertyId()
  const { property } = useOutletContext<PropertyWorkspaceContext>()

  const summaryQuery = useQuery({
    queryKey: ['coefficient-summary', propertyId],
    queryFn: async () => {
      const { data } = await api.get<CoefficientSummary>(
        `/api/Units/coefficient-summary?horizontalPropertyId=${encodeURIComponent(propertyId)}`,
      )
      return data
    },
  })

  const structureQuery = useQuery({
    queryKey: ['structure-composer-status', propertyId],
    queryFn: async () => {
      const { data } = await api.get<StructureComposerStatus>(
        `/api/StructureComposer/status?horizontalPropertyId=${encodeURIComponent(propertyId)}`,
      )
      return data
    },
  })

  const summary = summaryQuery.data

  return (
    <Stack gap="lg">
      <Group justify="space-between" align="flex-start">
        <Stack gap={4}>
          <Text size="sm" c="dimmed">
            {property.addressLine}, {property.city}
          </Text>
          <Text size="sm">
            Uso: {labelForOption(PROPERTY_USE_TYPE_OPTIONS, property.propertyUseType)}
            {property.nit ? ` · NIT ${property.nit}` : ''}
          </Text>
          {property.legalName ? (
            <Text size="sm" c="dimmed">
              Razón social: {property.legalName}
            </Text>
          ) : null}
        </Stack>
        <Button component={Link} to="/settings" variant="light">
          Datos del conjunto
        </Button>
      </Group>

      {structureQuery.data && !structureQuery.data.hasStructure ? (
        <Alert color="teal" title="Configura la estructura">
          Aún no hay bloques ni unidades. Usa el asistente para generar pisos y unidades de una vez.
          <div>
            <Button component={Link} to={`/properties/${propertyId}/estructura`} mt="sm" size="xs">
              Configurar estructura
            </Button>
          </div>
        </Alert>
      ) : null}

      <SimpleGrid cols={{ base: 1, sm: 3 }} spacing="md">
        <Stack gap={2}>
          <Text size="xs" c="dimmed" tt="uppercase">
            Coeficiente total
          </Text>
          <Title order={3}>{summary ? summary.totalCoefficient.toFixed(2) : '—'}</Title>
        </Stack>
        <Stack gap={2}>
          <Text size="xs" c="dimmed" tt="uppercase">
            Unidades
          </Text>
          <Title order={3}>{summary?.unitCount ?? '—'}</Title>
        </Stack>
        <Stack gap={2}>
          <Text size="xs" c="dimmed" tt="uppercase">
            Restante para 100
          </Text>
          <Title order={3} c={(summary?.remainingToHundred ?? 0) === 0 ? 'teal' : undefined}>
            {summary ? summary.remainingToHundred.toFixed(2) : '—'}
          </Title>
        </Stack>
      </SimpleGrid>
    </Stack>
  )
}
