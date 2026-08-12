import {
  ActionIcon,
  Button,
  Divider,
  Group,
  Loader,
  Paper,
  Select,
  Stack,
  Text,
  TextInput,
  Tooltip,
  UnstyledButton,
} from '@mantine/core'
import { notifications } from '@mantine/notifications'
import { IconPlus, IconTrash, IconUserPlus } from '@tabler/icons-react'
import { useMutation, useQuery } from '@tanstack/react-query'
import { useEffect, useMemo, useState } from 'react'
import { api } from '../../../api/client'
import { getApiErrorMessage } from '../../../api/errors'
import { buildListUrl, type PagedResult } from '../../../api/paging'
import type { Person, UnitHousehold, UnitHouseholdPerson, UnitOccupancy } from '../../../api/types'
import { FeatureCodes } from '../../../lib/permissions'
import {
  DOCUMENT_TYPE_OPTIONS,
  OCCUPANCY_ROLE_OPTIONS,
} from '../../../lib/structureEnums'
import { useAuthStore } from '../../../stores/authStore'
import { PersonChip } from './PersonChip'

type Props = {
  unitId: string
  household: UnitHousehold | undefined
  householdLoading: boolean
  /** Habitants only for apartments/houses; parking shows owner only. */
  showHabitants?: boolean
  onChanged: () => void
}

function todayIso() {
  return new Date().toISOString().slice(0, 10)
}

function PersonManageRow({
  person,
  variant,
  canManage,
  onRemove,
  removing,
}: {
  person: UnitHouseholdPerson
  variant: 'owner' | 'habitant'
  canManage: boolean
  onRemove: () => void
  removing: boolean
}) {
  return (
    <Stack gap={4}>
      <PersonChip person={person} variant={variant} />
      {canManage && (
        <Group justify="flex-end">
          <Tooltip label="Quitar de la unidad">
            <ActionIcon
              variant="subtle"
              color="red"
              size="sm"
              loading={removing}
              onClick={onRemove}
              aria-label="Quitar"
            >
              <IconTrash size={14} />
            </ActionIcon>
          </Tooltip>
        </Group>
      )}
    </Stack>
  )
}

export function UnitPersonasPanel({
  unitId,
  household,
  householdLoading,
  showHabitants = true,
  onChanged,
}: Props) {
  const canManage = useAuthStore((s) => s.permissions.includes(FeatureCodes.peopleManage))
  const [adding, setAdding] = useState(false)
  const [creatingPerson, setCreatingPerson] = useState(false)
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [selectedPersonId, setSelectedPersonId] = useState<string | null>(null)
  const [linkRole, setLinkRole] = useState<string>('Owner')
  const [removingId, setRemovingId] = useState<string | null>(null)

  const roleOptions = useMemo(
    () =>
      showHabitants
        ? OCCUPANCY_ROLE_OPTIONS.map((o) => ({ value: o.value, label: o.label }))
        : OCCUPANCY_ROLE_OPTIONS.filter((o) => o.value === 'Owner').map((o) => ({
            value: o.value,
            label: o.label,
          })),
    [showHabitants],
  )

  const [newPerson, setNewPerson] = useState({
    documentType: 'CC',
    documentNumber: '',
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
  })

  useEffect(() => {
    const t = window.setTimeout(() => setDebouncedSearch(search.trim()), 250)
    return () => window.clearTimeout(t)
  }, [search])

  useEffect(() => {
    setAdding(false)
    setCreatingPerson(false)
    setSearch('')
    setSelectedPersonId(null)
    setLinkRole('Owner')
  }, [unitId])

  useEffect(() => {
    if (!showHabitants && linkRole !== 'Owner') {
      setLinkRole('Owner')
    }
  }, [showHabitants, linkRole])

  const linkedPersonIds = useMemo(() => {
    const ids = new Set<string>()
    for (const p of household?.owners ?? []) ids.add(p.personId)
    for (const p of household?.habitants ?? []) ids.add(p.personId)
    return ids
  }, [household])

  const peopleSearch = useQuery({
    queryKey: ['people-search-unit', debouncedSearch],
    enabled: adding && canManage && debouncedSearch.length >= 2,
    queryFn: async () => {
      const url = buildListUrl('/api/People', {
        page: 1,
        pageSize: 25,
        sortBy: 'lastname',
        sortDir: 'asc',
        search: debouncedSearch,
        includeInactive: false,
        columnFilters: {},
      })
      const { data } = await api.get<PagedResult<Person>>(url)
      return data.items
    },
  })

  const searchResults = useMemo(
    () => (peopleSearch.data ?? []).filter((p) => !linkedPersonIds.has(p.id)),
    [peopleSearch.data, linkedPersonIds],
  )

  const ownerCount = household?.owners.length ?? 0
  const canAddOwner = ownerCount < 2

  const linkMutation = useMutation({
    mutationFn: async (personId: string) => {
      const isOwner = linkRole === 'Owner'
      const hasOwners = (household?.owners.length ?? 0) > 0
      const { data } = await api.post<UnitOccupancy>('/api/UnitOccupancies', {
        unitId,
        personId,
        role: linkRole,
        isPrimary: isOwner && !hasOwners,
        receivesBilling: isOwner && !hasOwners,
        isCommunicationResponsible: isOwner && !hasOwners,
        startDate: todayIso(),
        endDate: null,
      })
      return data
    },
    onSuccess: () => {
      notifications.show({ title: 'Vinculado', message: 'Persona asignada a la unidad', color: 'teal' })
      setAdding(false)
      setCreatingPerson(false)
      setSearch('')
      setSelectedPersonId(null)
      onChanged()
    },
    onError: (err) =>
      notifications.show({ title: 'Error', message: getApiErrorMessage(err), color: 'red' }),
  })

  const createPersonMutation = useMutation({
    mutationFn: async () => {
      const { data } = await api.post<Person>('/api/People', {
        documentType: newPerson.documentType,
        documentNumber: newPerson.documentNumber.trim(),
        firstName: newPerson.firstName.trim(),
        lastName: newPerson.lastName.trim(),
        email: newPerson.email.trim() || null,
        phone: newPerson.phone.trim() || null,
      })
      return data
    },
    onSuccess: (person) => {
      notifications.show({ title: 'Persona creada', message: person.firstName, color: 'teal' })
      setCreatingPerson(false)
      setSelectedPersonId(person.id)
      setSearch(`${person.firstName} ${person.lastName}`)
      linkMutation.mutate(person.id)
    },
    onError: (err) =>
      notifications.show({ title: 'Error', message: getApiErrorMessage(err), color: 'red' }),
  })

  const removeMutation = useMutation({
    mutationFn: async (occupancyId: string) => {
      setRemovingId(occupancyId)
      await api.delete(`/api/UnitOccupancies/${occupancyId}`)
    },
    onSuccess: () => {
      notifications.show({ title: 'Quitado', message: 'Persona desvinculada de la unidad', color: 'teal' })
      setRemovingId(null)
      onChanged()
    },
    onError: (err) => {
      setRemovingId(null)
      notifications.show({ title: 'Error', message: getApiErrorMessage(err), color: 'red' })
    },
  })

  const startAdd = (defaultRole: string) => {
    setLinkRole(defaultRole)
    setAdding(true)
    setCreatingPerson(false)
    setSearch('')
    setSelectedPersonId(null)
  }

  if (householdLoading) {
    return <Loader size="sm" />
  }

  return (
    <Stack gap="md">
      <Text size="xs" c="dimmed">
        {showHabitants
          ? 'Estas personas se usarán más adelante para mensajería y portería (entregas).'
          : 'Asigna el propietario del parqueadero (mensajería y portería más adelante).'}
      </Text>

      <Stack gap={6}>
        <Group justify="space-between" align="center">
          <Text size="xs" c="dimmed" tt="uppercase" fw={600}>
            Propietario
          </Text>
          {canManage && !adding && canAddOwner && (
            <Button
              size="compact-xs"
              variant="subtle"
              color="teal"
              leftSection={<IconPlus size={12} />}
              onClick={() => startAdd('Owner')}
            >
              Agregar
            </Button>
          )}
        </Group>
        {!canAddOwner && (
          <Text size="xs" c="dimmed">
            Máximo 2 propietarios por unidad.
          </Text>
        )}
        {(household?.owners.length ?? 0) > 0 ? (
          household!.owners.map((p) => (
            <PersonManageRow
              key={p.occupancyId || p.personId}
              person={p}
              variant="owner"
              canManage={canManage}
              removing={removingId === p.occupancyId}
              onRemove={() => {
                if (!p.occupancyId) return
                if (window.confirm(`¿Quitar a ${p.fullName} de esta unidad?`)) {
                  removeMutation.mutate(p.occupancyId)
                }
              }}
            />
          ))
        ) : (
          <Text size="sm" c="dimmed">
            Sin propietario asignado
          </Text>
        )}
      </Stack>

      {showHabitants && (
        <Stack gap={6}>
          <Group justify="space-between" align="center">
            <Text size="xs" c="dimmed" tt="uppercase" fw={600}>
              Habitantes
            </Text>
            {canManage && !adding && (
              <Button
                size="compact-xs"
                variant="subtle"
                color="teal"
                leftSection={<IconPlus size={12} />}
                onClick={() => startAdd('Resident')}
              >
                Agregar
              </Button>
            )}
          </Group>
          {(household?.habitants.length ?? 0) > 0 ? (
            household!.habitants.map((p) => (
              <PersonManageRow
                key={p.occupancyId || p.personId}
                person={p}
                variant="habitant"
                canManage={canManage}
                removing={removingId === p.occupancyId}
                onRemove={() => {
                  if (!p.occupancyId) return
                  if (window.confirm(`¿Quitar a ${p.fullName} de esta unidad?`)) {
                    removeMutation.mutate(p.occupancyId)
                  }
                }}
              />
            ))
          ) : (
            <Text size="sm" c="dimmed">
              Sin habitantes
            </Text>
          )}
        </Stack>
      )}

      {!canManage && (
        <Text size="xs" c="dimmed">
          Necesitas permiso de personas para asignar residentes.
        </Text>
      )}

      {canManage && adding && (
        <>
          <Divider label="Agregar persona" labelPosition="center" />
          {!creatingPerson ? (
            <Stack gap="sm">
              {showHabitants && (
                <Select
                  label="Rol"
                  data={
                    canAddOwner
                      ? roleOptions
                      : roleOptions.filter((o) => o.value !== 'Owner')
                  }
                  value={linkRole === 'Owner' && !canAddOwner ? 'Resident' : linkRole}
                  onChange={(v) => setLinkRole(v ?? 'Resident')}
                />
              )}
              <TextInput
                label="Buscar persona"
                placeholder="Nombre o documento (mín. 2 caracteres)"
                value={search}
                onChange={(e) => {
                  setSearch(e.currentTarget.value)
                  setSelectedPersonId(null)
                }}
              />
              {debouncedSearch.length >= 2 && (
                <Stack gap={6}>
                  <Text size="xs" c="dimmed">
                    {peopleSearch.isFetching
                      ? 'Buscando…'
                      : peopleSearch.isError
                        ? getApiErrorMessage(peopleSearch.error)
                        : `${searchResults.length} resultado(s)`}
                  </Text>
                  {searchResults.map((p) => {
                    const selected = selectedPersonId === p.id
                    return (
                      <UnstyledButton
                        key={p.id}
                        onClick={() => setSelectedPersonId(p.id)}
                        p="sm"
                        style={{
                          borderRadius: 8,
                          border: selected
                            ? '1.5px solid var(--mantine-color-teal-6)'
                            : '1px solid var(--mantine-color-gray-3)',
                          background: selected
                            ? 'var(--mantine-color-teal-0)'
                            : 'var(--mantine-color-body)',
                          textAlign: 'left',
                        }}
                      >
                        <Text size="sm" fw={600}>
                          {p.firstName} {p.lastName}
                        </Text>
                        <Text size="xs" c="dimmed">
                          {p.documentType} {p.documentNumber}
                        </Text>
                      </UnstyledButton>
                    )
                  })}
                  {!peopleSearch.isFetching &&
                    !peopleSearch.isError &&
                    searchResults.length === 0 && (
                      <Paper withBorder p="sm" radius="md">
                        <Text size="sm" c="dimmed">
                          Sin coincidencias. Puedes crear la persona.
                        </Text>
                      </Paper>
                    )}
                </Stack>
              )}
              <Group gap="xs">
                <Button
                  color="teal"
                  disabled={!selectedPersonId || (linkRole === 'Owner' && !canAddOwner)}
                  loading={linkMutation.isPending}
                  onClick={() => selectedPersonId && linkMutation.mutate(selectedPersonId)}
                >
                  Vincular
                </Button>
                <Button
                  variant="light"
                  leftSection={<IconUserPlus size={14} />}
                  onClick={() => {
                    setCreatingPerson(true)
                    setNewPerson((p) => ({
                      ...p,
                      documentNumber: /^\d/.test(search) ? search : p.documentNumber,
                      firstName: /^\d/.test(search) ? '' : search.split(/\s+/)[0] ?? '',
                      lastName: /^\d/.test(search) ? '' : search.split(/\s+/).slice(1).join(' '),
                    }))
                  }}
                >
                  Crear persona
                </Button>
                <Button variant="subtle" onClick={() => setAdding(false)}>
                  Cancelar
                </Button>
              </Group>
            </Stack>
          ) : (
            <Stack gap="sm">
              <Select
                label="Tipo de documento"
                data={DOCUMENT_TYPE_OPTIONS.map((o) => ({ value: o.value, label: o.label }))}
                value={newPerson.documentType}
                onChange={(v) => setNewPerson((p) => ({ ...p, documentType: v ?? 'CC' }))}
              />
              <TextInput
                label="Número de documento"
                value={newPerson.documentNumber}
                onChange={(e) =>
                  setNewPerson((p) => ({ ...p, documentNumber: e.currentTarget.value }))
                }
                required
              />
              <TextInput
                label="Nombres"
                value={newPerson.firstName}
                onChange={(e) => setNewPerson((p) => ({ ...p, firstName: e.currentTarget.value }))}
                required
              />
              <TextInput
                label="Apellidos"
                value={newPerson.lastName}
                onChange={(e) => setNewPerson((p) => ({ ...p, lastName: e.currentTarget.value }))}
                required
              />
              <TextInput
                label="Teléfono"
                value={newPerson.phone}
                onChange={(e) => setNewPerson((p) => ({ ...p, phone: e.currentTarget.value }))}
              />
              <TextInput
                label="Correo"
                value={newPerson.email}
                onChange={(e) => setNewPerson((p) => ({ ...p, email: e.currentTarget.value }))}
              />
              <Group gap="xs">
                <Button
                  color="teal"
                  loading={createPersonMutation.isPending || linkMutation.isPending}
                  disabled={
                    !newPerson.documentNumber.trim() ||
                    !newPerson.firstName.trim() ||
                    !newPerson.lastName.trim()
                  }
                  onClick={() => createPersonMutation.mutate()}
                >
                  Crear y vincular
                </Button>
                <Button variant="subtle" onClick={() => setCreatingPerson(false)}>
                  Volver a buscar
                </Button>
              </Group>
            </Stack>
          )}
        </>
      )}
    </Stack>
  )
}
