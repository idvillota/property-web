import { Button, Loader, NumberInput, Stack, Text } from '@mantine/core'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { api } from '../../../api/client'
import { getApiErrorMessage } from '../../../api/errors'
import { PageHeader } from '../../../components/shared/PageHeader'
import { usePropertyId } from '../../../hooks/usePropertyId'
import { ParkingSettings_SaveRates } from '../lib/parkingSettingsSaveRates'

export function VisitorParkingSettingsPage() {
  const propertyId = usePropertyId()
  const queryClient = useQueryClient()
  const [totalSpots, setTotalSpots] = useState<number | string>(10)
  const [hourlyRate, setHourlyRate] = useState<number | string>(5000)

  const settingsQuery = useQuery({
    queryKey: ['visitor-parking-settings', propertyId],
    queryFn: async () => {
      const { data } = await api.get('/api/visitor-parking/settings', {
        params: { horizontalPropertyId: propertyId },
      })
      return data as { totalSpots: number; hourlyRate: number; occupiedSpots: number }
    },
    retry: false,
  })

  const saveMutation = useMutation({
    mutationFn: async () => {
      await api.put('/api/visitor-parking/settings', {
        horizontalPropertyId: propertyId,
        totalSpots: Number(totalSpots),
        hourlyRate: Number(hourlyRate),
      })
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['visitor-parking-settings', propertyId] }),
  })

  const canSave = ParkingSettings_SaveRates(Number(totalSpots), Number(hourlyRate))

  return (
    <Stack gap="md">
      <PageHeader title="Parqueadero visitantes" description="Cupos y tarifas por hora." />
      {settingsQuery.isLoading ? <Loader size="sm" /> : null}
      {settingsQuery.data ? (
        <Text size="sm">Ocupados: {settingsQuery.data.occupiedSpots} / {settingsQuery.data.totalSpots}</Text>
      ) : null}
      <NumberInput label="Cupos totales" value={totalSpots} onChange={setTotalSpots} min={0} />
      <NumberInput label="Tarifa por hora (COP)" value={hourlyRate} onChange={setHourlyRate} min={0} />
      <Button disabled={!canSave} loading={saveMutation.isPending} onClick={() => saveMutation.mutate()}>
        Guardar tarifas
      </Button>
      {saveMutation.isError ? <Text c="red">{getApiErrorMessage(saveMutation.error)}</Text> : null}
    </Stack>
  )
}
