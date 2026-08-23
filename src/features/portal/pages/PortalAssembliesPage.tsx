import { Alert, Button, Group, Loader, Radio, Select, Stack, Text, Title } from '@mantine/core'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useMemo, useState } from 'react'
import { api } from '../../../api/client'
import { getApiErrorMessage } from '../../../api/errors'
import { useAuthStore } from '../../../stores/authStore'
import { useCurrentProperty } from '../../../hooks/useCurrentProperty'
import { formDrawerSelectComboboxProps } from '../../../lib/formDrawerSelect'

type PortalAssembly = {
  id: string
  title: string
  scheduledAtUtc: string
  status: number
}

type OpenMotion = {
  id: string
  assemblyId: string
  title: string
  description: string | null
  status: number
}

const CHOICE_OPTIONS = [
  { value: '0', label: 'Sí' },
  { value: '1', label: 'No' },
  { value: '2', label: 'Abstención' },
]

/** Portal voting for published assemblies (ASM-003 / assembly.vote). */
export function PortalAssembliesPage() {
  const propertyQuery = useCurrentProperty()
  const propertyId = propertyQuery.data?.id
  const unitIds = useAuthStore((s) => s.unitIds)
  const unitId = unitIds[0] ?? null
  const queryClient = useQueryClient()
  const [assemblyId, setAssemblyId] = useState<string | null>(null)
  const [motionId, setMotionId] = useState<string | null>(null)
  const [choice, setChoice] = useState<string | null>('0')

  const assembliesQuery = useQuery({
    queryKey: ['portal-assemblies', propertyId],
    enabled: Boolean(propertyId),
    queryFn: async () => {
      const { data } = await api.get<PortalAssembly[]>('/api/assemblies/portal', {
        params: { horizontalPropertyId: propertyId },
      })
      return data
    },
  })

  const motionsQuery = useQuery({
    queryKey: ['portal-assembly-motions', assemblyId],
    enabled: Boolean(assemblyId),
    queryFn: async () => {
      const { data } = await api.get<OpenMotion[]>(`/api/assemblies/${assemblyId}/motions/open`)
      return data
    },
  })

  const assemblyOptions = useMemo(
    () => (assembliesQuery.data ?? []).map((a) => ({ value: a.id, label: a.title })),
    [assembliesQuery.data],
  )

  const voteMutation = useMutation({
    mutationFn: async () => {
      if (!motionId || !unitId || choice == null) throw new Error('Seleccione moción y voto')
      await api.post('/api/assemblies/votes', {
        motionId,
        unitId,
        choice: Number(choice),
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['portal-assembly-motions', assemblyId] })
      setMotionId(null)
    },
  })

  if (!unitId) {
    return <Alert color="yellow">No hay unidad vinculada para votar.</Alert>
  }

  return (
    <Stack gap="md" maw={560}>
      <Title order={3}>Asambleas</Title>
      <Text c="dimmed" size="sm">
        Vote mociones abiertas de asambleas publicadas. Su voto usa la unidad vinculada al portal.
      </Text>

      {assembliesQuery.isLoading ? <Loader size="sm" /> : null}
      {assembliesQuery.isError ? (
        <Alert color="red">{getApiErrorMessage(assembliesQuery.error)}</Alert>
      ) : null}

      <Select
        label="Asamblea"
        placeholder="Seleccione"
        data={assemblyOptions}
        value={assemblyId}
        onChange={(v) => {
          setAssemblyId(v)
          setMotionId(null)
        }}
        comboboxProps={formDrawerSelectComboboxProps}
      />

      {motionsQuery.isLoading ? <Loader size="sm" /> : null}
      {(motionsQuery.data ?? []).length === 0 && assemblyId ? (
        <Alert color="gray">No hay mociones abiertas en esta asamblea.</Alert>
      ) : null}

      <Radio.Group value={motionId ?? ''} onChange={setMotionId} label="Moción abierta">
        <Stack gap="xs" mt="xs">
          {(motionsQuery.data ?? []).map((m) => (
            <Radio key={m.id} value={m.id} label={m.title} />
          ))}
        </Stack>
      </Radio.Group>

      <Radio.Group value={choice ?? '0'} onChange={setChoice} label="Su voto">
        <Group mt="xs">
          {CHOICE_OPTIONS.map((o) => (
            <Radio key={o.value} value={o.value} label={o.label} />
          ))}
        </Group>
      </Radio.Group>

      <Button
        disabled={!motionId || voteMutation.isPending}
        loading={voteMutation.isPending}
        onClick={() => voteMutation.mutate()}
      >
        Registrar voto
      </Button>
      {voteMutation.isError ? (
        <Text c="red" size="sm">
          {getApiErrorMessage(voteMutation.error)}
        </Text>
      ) : null}
      {voteMutation.isSuccess ? (
        <Text c="teal" size="sm">
          Voto registrado.
        </Text>
      ) : null}
    </Stack>
  )
}
