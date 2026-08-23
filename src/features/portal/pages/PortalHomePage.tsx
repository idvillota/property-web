import { Alert, Loader, Stack, Text } from '@mantine/core'
import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { api } from '../../../api/client'
import { getApiErrorMessage } from '../../../api/errors'
import type { PortalHome } from '../../../api/types'
import { portalHomeShowsUnitCards } from '../lib/portalHomeShowsUnitCards'

const OCCUPANCY_LABELS: Record<string, string> = {
  Owner: 'Propietario',
  Tenant: 'Arrendatario',
  Resident: 'Residente',
  AuthorizedOccupant: 'Ocupante autorizado',
}

export function PortalHomePage() {
  const homeQuery = useQuery({
    queryKey: ['portalHome'],
    queryFn: async () => {
      const { data } = await api.get<PortalHome>('/api/portal/home')
      return data
    },
  })

  if (homeQuery.isLoading) {
    return (
      <Stack align="center" py="xl">
        <Loader color="teal" />
      </Stack>
    )
  }

  if (homeQuery.isError) {
    return (
      <Alert color="red" title="No se pudo cargar el portal">
        {getApiErrorMessage(homeQuery.error)}
      </Alert>
    )
  }

  const home = homeQuery.data!
  const showUnits = portalHomeShowsUnitCards(home.units)

  return (
    <Stack gap="lg">
      <header className="portal-hero">
        <Text className="portal-hero-title">Hola, {home.personFullName}</Text>
        <Text c="dimmed" mt={6}>
          {home.propertyName ? `${home.propertyName} · ` : ''}
          Tus unidades y accesos del conjunto
        </Text>
      </header>

      {!showUnits ? (
        <Alert color="yellow" title="Sin unidades">
          No hay ocupaciones activas vinculadas a tu persona. Contacta a la administración.
        </Alert>
      ) : (
        <div className="portal-unit-grid">
          {home.units.map((unit, index) => (
            <div
              key={unit.unitId}
              className="portal-unit-card"
              style={{ animationDelay: `${index * 60}ms` }}
            >
              <Text className="portal-unit-code">Unidad {unit.code}</Text>
              <Text size="sm" c="dimmed" mt={4}>
                {OCCUPANCY_LABELS[unit.occupancyRole] ?? unit.occupancyRole}
                {unit.isPrimary ? ' · Principal' : ''}
              </Text>
            </div>
          ))}
        </div>
      )}

      <div className="portal-links">
        {home.quickLinks.map((link) => (
          <Link
            key={link.id}
            to={link.path}
            className="portal-link"
            data-disabled={!link.available}
            aria-disabled={!link.available}
            onClick={(e) => {
              if (!link.available) e.preventDefault()
            }}
          >
            <Text fw={600} size="sm">
              {link.label}
            </Text>
            <Text size="xs" c="dimmed">
              {link.available ? 'Abrir' : 'Próximamente'}
            </Text>
          </Link>
        ))}
      </div>
    </Stack>
  )
}
