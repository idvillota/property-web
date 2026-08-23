import { Alert, Button, Loader, Radio, Stack, Text, Title } from '@mantine/core'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { api } from '../../../api/client'
import { getApiErrorMessage } from '../../../api/errors'
import { useAuthStore } from '../../../stores/authStore'
import { useCurrentProperty } from '../../../hooks/useCurrentProperty'
import { PortalPoll_SubmitVote } from '../lib/portalPollSubmitVote'

type Poll = {
  id: string
  title: string
  status: number
  options: { id: string; label: string; voteCount: number }[]
}

export function PortalPollsPage() {
  const propertyQuery = useCurrentProperty()
  const propertyId = propertyQuery.data?.id
  const unitIds = useAuthStore((s) => s.unitIds)
  const unitId = unitIds[0] ?? null
  const queryClient = useQueryClient()
  const [selectedOption, setSelectedOption] = useState<string | null>(null)
  const [activePollId, setActivePollId] = useState<string | null>(null)

  const query = useQuery({
    queryKey: ['portal-polls', propertyId],
    enabled: Boolean(propertyId),
    queryFn: async () => {
      const { data } = await api.get<Poll[]>('/api/polls/portal', {
        params: { horizontalPropertyId: propertyId },
      })
      return data.filter((p) => p.status === 1)
    },
  })

  const voteMutation = useMutation({
    mutationFn: async () => {
      await api.post('/api/polls/votes', {
        pollId: activePollId,
        pollOptionId: selectedOption,
        unitId,
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['portal-polls', propertyId] })
      setSelectedOption(null)
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

  const canVote = PortalPoll_SubmitVote(selectedOption, unitId ?? null)

  return (
    <Stack gap="md">
      <Title order={3}>Encuestas</Title>
      {query.isLoading ? <Loader size="sm" /> : null}
      {query.isError ? <Text c="red">{getApiErrorMessage(query.error)}</Text> : null}
      {(query.data ?? []).map((poll) => (
        <Stack key={poll.id} gap="xs">
          <Text fw={600}>{poll.title}</Text>
          <Radio.Group
            value={activePollId === poll.id ? selectedOption : null}
            onChange={(v) => {
              setActivePollId(poll.id)
              setSelectedOption(v)
            }}
          >
            <Stack gap="xs">
              {poll.options.map((o) => (
                <Radio key={o.id} value={o.id} label={`${o.label} (${o.voteCount})`} />
              ))}
            </Stack>
          </Radio.Group>
          {activePollId === poll.id ? (
            <Button disabled={!canVote} loading={voteMutation.isPending} onClick={() => voteMutation.mutate()}>
              Enviar voto
            </Button>
          ) : null}
        </Stack>
      ))}
      {voteMutation.isError ? <Text c="red">{getApiErrorMessage(voteMutation.error)}</Text> : null}
    </Stack>
  )
}
