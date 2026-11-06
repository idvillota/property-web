import { Alert, Button, Select, Stack, TextInput } from '@mantine/core'
import { useForm } from '@mantine/form'
import { notifications } from '@mantine/notifications'
import { useMutation, useQuery } from '@tanstack/react-query'
import { useEffect } from 'react'
import { api } from '../../../api/client'
import { getApiErrorMessage } from '../../../api/errors'
import type { BreBPaymentProfile } from '../../../api/types'
import { PageHeader } from '../../../components/shared/PageHeader'
import { useInvalidate } from '../../../hooks/useInvalidate'
import { usePropertyId } from '../../../hooks/usePropertyId'

const keyTypes = [
  { value: '1', label: 'Identificación' },
  { value: '2', label: 'Celular' },
  { value: '3', label: 'Correo' },
  { value: '4', label: 'Alfanumérica' },
  { value: '5', label: 'Código de comercio' },
]

function keyProblem(key: string): string | null {
  const value = key.trim()
  if (!value) return null
  if (value.length > 40 || [...value].some((char) => char.charCodeAt(0) < 33 || char.charCodeAt(0) > 126)) {
    return 'La llave debe tener entre 1 y 40 caracteres simples, sin espacios.'
  }
  return null
}

export function BreBSettingsPage() {
  const propertyId = usePropertyId()
  const invalidate = useInvalidate(['breb-profile'])

  const profileQuery = useQuery({
    queryKey: ['breb-profile', propertyId],
    queryFn: async () => {
      const { data } = await api.get<BreBPaymentProfile>(`/api/BreBPaymentProfiles/${propertyId}`)
      return data
    },
  })

  const form = useForm({
    initialValues: {
      key: '',
      keyType: '',
      merchantName: '',
      city: '',
      postalCode: '',
    },
    validate: {
      key: keyProblem,
      keyType: (value, values) => (values.key.trim() && !value ? 'Elige el tipo de llave' : null),
      merchantName: (value) => (value.trim().length > 80 ? 'Máximo 80 caracteres' : null),
      city: (value) => (value.trim().length > 40 ? 'Máximo 40 caracteres' : null),
      postalCode: (value) => (value.trim().length > 10 ? 'Máximo 10 caracteres' : null),
    },
  })

  useEffect(() => {
    const data = profileQuery.data
    if (!data) return
    form.setValues({
      key: data.key,
      keyType: data.keyType ? String(data.keyType) : '',
      merchantName: data.merchantName,
      city: data.city,
      postalCode: data.postalCode,
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps -- sync when server data loads
  }, [profileQuery.data])

  const saveMutation = useMutation({
    mutationFn: async () => {
      const payload = {
        key: form.values.key.trim(),
        keyType: Number(form.values.keyType) || 0,
        merchantName: form.values.merchantName.trim(),
        city: form.values.city.trim(),
        postalCode: form.values.postalCode.trim(),
      }
      const { data } = await api.put<BreBPaymentProfile>(`/api/BreBPaymentProfiles/${propertyId}`, payload)
      return data
    },
    onSuccess: (data) => {
      notifications.show({
        title: 'Guardado',
        message: data.isReady
          ? 'La liquidación enviará el QR de la cuota.'
          : 'Falta completar la llave, el tipo, el nombre o la ciudad para enviar el QR.',
        color: data.isReady ? 'teal' : 'yellow',
      })
      invalidate()
    },
    onError: (err) =>
      notifications.show({ title: 'Error', message: getApiErrorMessage(err), color: 'red' }),
  })

  const ready = profileQuery.data?.isReady === true

  return (
    <Stack gap="md" maw={560}>
      <PageHeader
        title="Pago Bre-B"
        description="Llave con la que se arma el QR de la cuota de administración. El correo sale al liquidar el mes."
      />

      <Alert color={ready ? 'teal' : 'gray'} title={ready ? 'Lista para el cobro' : 'Aún no envía el QR'}>
        El código lleva el valor de la cuota de esa unidad y se manda a quien tiene marcado “recibe cobro” y un correo.
        Escanearlo no registra el pago.
      </Alert>

      <form onSubmit={form.onSubmit(() => saveMutation.mutate())}>
        <Stack gap="sm">
          <TextInput
            label="Llave Bre-B"
            description="Identificación, celular, correo, llave alfanumérica o código de comercio. Sin espacios."
            {...form.getInputProps('key')}
          />
          <Select
            label="Tipo de llave"
            data={keyTypes}
            placeholder="Elige el tipo"
            {...form.getInputProps('keyType')}
          />
          <TextInput
            label="Nombre en la transferencia"
            description="Es el nombre que ve la persona en su banco. El QR usa los primeros 25 caracteres."
            {...form.getInputProps('merchantName')}
          />
          <TextInput label="Ciudad" {...form.getInputProps('city')} />
          <TextInput
            label="Código postal"
            description="Opcional."
            {...form.getInputProps('postalCode')}
          />
          <Button type="submit" loading={saveMutation.isPending || profileQuery.isLoading}>
            Guardar
          </Button>
        </Stack>
      </form>
    </Stack>
  )
}
