import { Button, Group, Stack, Text, TextInput } from '@mantine/core'
import { notifications } from '@mantine/notifications'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { api } from '../../../api/client'
import { getApiErrorMessage } from '../../../api/errors'
import type { UserPersonLink } from '../../../api/types'
import { FeatureCodes } from '../../../lib/permissions'
import { useAuthStore } from '../../../stores/authStore'
import { personLinkUserFormRequiresEmailOrUser } from '../lib/personAccessLinkValidation'

type Props = {
  personId: string
}

export function PersonAccessLinkPanel({ personId }: Props) {
  const canLink = useAuthStore((s) => s.hasPermission(FeatureCodes.organizationTeam))
  const queryClient = useQueryClient()
  const [email, setEmail] = useState('')
  const [userId, setUserId] = useState('')

  const linkQuery = useQuery({
    queryKey: ['person-access-link', personId],
    enabled: canLink && !!personId,
    queryFn: async () => {
      const { data } = await api.get<UserPersonLink | null>(`/api/people/${personId}/access-link`)
      return data
    },
  })

  const linkMutation = useMutation({
    mutationFn: async () => {
      const body = {
        email: email.trim() || null,
        userId: userId.trim() || null,
      }
      const { data } = await api.put<UserPersonLink>(`/api/people/${personId}/access-link`, body)
      return data
    },
    onSuccess: () => {
      notifications.show({
        title: 'Acceso vinculado',
        message: 'El usuario podrá usar el portal con las unidades de esta persona. Debe volver a iniciar sesión.',
        color: 'teal',
      })
      void queryClient.invalidateQueries({ queryKey: ['person-access-link', personId] })
      setEmail('')
      setUserId('')
    },
    onError: (err) =>
      notifications.show({ title: 'Error', message: getApiErrorMessage(err), color: 'red' }),
  })

  const submitLink = () => {
    if (!personLinkUserFormRequiresEmailOrUser(email, userId)) {
      notifications.show({
        title: 'Datos incompletos',
        message: 'Indica el correo del usuario o su Id.',
        color: 'orange',
      })
      return
    }
    linkMutation.mutate()
  }

  const unlinkMutation = useMutation({
    mutationFn: async () => {
      await api.delete(`/api/people/${personId}/access-link`)
    },
    onSuccess: () => {
      notifications.show({ title: 'Vínculo removido', message: 'Acceso portal desvinculado.', color: 'gray' })
      void queryClient.invalidateQueries({ queryKey: ['person-access-link', personId] })
    },
    onError: (err) =>
      notifications.show({ title: 'Error', message: getApiErrorMessage(err), color: 'red' }),
  })

  if (!canLink) return null

  const link = linkQuery.data

  return (
    <Stack gap="xs">
      <Text size="xs" tt="uppercase" fw={700} c="dimmed">
        Acceso portal (usuario)
      </Text>
      {linkQuery.isLoading ? (
        <Text size="sm" c="dimmed">
          Cargando vínculo…
        </Text>
      ) : link ? (
        <Stack gap={6}>
          <Text size="sm">
            Vinculado a <Text span fw={600}>{link.userEmail}</Text>
            {link.unitIds.length > 0
              ? ` · ${link.unitIds.length} unidad(es) en token`
              : ' · sin ocupaciones activas'}
          </Text>
          <Button
            size="compact-sm"
            variant="light"
            color="red"
            loading={unlinkMutation.isPending}
            onClick={() => unlinkMutation.mutate()}
          >
            Desvincular acceso
          </Button>
        </Stack>
      ) : (
        <Stack gap="sm">
          <Text size="sm" c="dimmed">
            Vincula un usuario del equipo (ya invitado) para que use el portal con las unidades de esta
            persona.
          </Text>
          <TextInput
            label="Correo del usuario"
            placeholder="usuario@ejemplo.com"
            value={email}
            onChange={(e) => setEmail(e.currentTarget.value)}
          />
          <TextInput
            label="Id de usuario (opcional)"
            placeholder="GUID"
            value={userId}
            onChange={(e) => setUserId(e.currentTarget.value)}
          />
          <Group>
            <Button
              size="compact-sm"
              color="teal"
              loading={linkMutation.isPending}
              onClick={submitLink}
            >
              Vincular acceso
            </Button>
          </Group>
        </Stack>
      )}
    </Stack>
  )
}
