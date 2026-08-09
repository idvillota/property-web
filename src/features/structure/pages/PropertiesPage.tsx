import { Alert, Button, Loader, Select, Stack, Textarea, TextInput } from '@mantine/core'
import { useForm } from '@mantine/form'
import { notifications } from '@mantine/notifications'
import { useMutation } from '@tanstack/react-query'
import { useMemo } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { api } from '../../../api/client'
import { getApiErrorMessage } from '../../../api/errors'
import type { HorizontalProperty, Neighborhood } from '../../../api/types'
import { PageHeader } from '../../../components/shared/PageHeader'
import { useCurrentProperty } from '../../../hooks/useCurrentProperty'
import { useEntityOptions } from '../../../hooks/useEntityOptions'
import { useInvalidate } from '../../../hooks/useInvalidate'
import { formDrawerSelectComboboxProps } from '../../../lib/formDrawerSelect'
import { PROPERTY_USE_TYPE_OPTIONS } from '../../../lib/structureEnums'

/** Hub for the tenant's single property: redirect if it exists, otherwise create it. */
export function PropertiesPage() {
  const navigate = useNavigate()
  const current = useCurrentProperty()
  const invalidate = useInvalidate(['horizontal-properties', 'horizontal-property', 'tenantSettings'])
  const neighborhoods = useEntityOptions<Neighborhood>('neighborhood-options', '/api/Neighborhoods')

  const form = useForm({
    initialValues: {
      name: '',
      tradeName: '',
      legalName: '',
      nit: '',
      taxRegime: '',
      legalRepresentative: '',
      addressLine: '',
      city: '',
      country: 'Colombia',
      postalCode: '',
      phone: '',
      neighborhoodId: '' as string | null,
      propertyUseType: 'Residential',
      matriculaInmobiliaria: '',
      regulationNotes: '',
      coefficientBasisNotes: '',
    },
    validate: {
      name: (v) => (v.trim().length < 1 ? 'Obligatorio' : null),
      addressLine: (v) => (v.trim().length < 1 ? 'Obligatorio' : null),
      city: (v) => (v.trim().length < 1 ? 'Obligatorio' : null),
      country: (v) => (v.trim().length < 1 ? 'Obligatorio' : null),
      propertyUseType: (v) => (v.trim().length < 1 ? 'Obligatorio' : null),
    },
  })

  const createMutation = useMutation({
    mutationFn: async () => {
      const payload = {
        name: form.values.name.trim(),
        tradeName: form.values.tradeName.trim() || null,
        legalName: form.values.legalName.trim() || null,
        nit: form.values.nit.trim() || null,
        taxRegime: form.values.taxRegime.trim() || null,
        legalRepresentative: form.values.legalRepresentative.trim() || null,
        addressLine: form.values.addressLine.trim(),
        city: form.values.city.trim(),
        country: form.values.country.trim(),
        postalCode: form.values.postalCode.trim() || null,
        phone: form.values.phone.trim() || null,
        neighborhoodId: form.values.neighborhoodId || null,
        propertyUseType: form.values.propertyUseType,
        matriculaInmobiliaria: form.values.matriculaInmobiliaria.trim() || null,
        regulationNotes: form.values.regulationNotes.trim() || null,
        coefficientBasisNotes: form.values.coefficientBasisNotes.trim() || null,
      }
      const { data } = await api.post<HorizontalProperty>('/api/HorizontalProperties', payload)
      return data
    },
    onSuccess: (created) => {
      notifications.show({ title: 'Creada', message: 'Propiedad registrada', color: 'teal' })
      invalidate()
      navigate(`/properties/${created.id}`, { replace: true })
    },
    onError: (err) =>
      notifications.show({ title: 'Error', message: getApiErrorMessage(err), color: 'red' }),
  })

  const neighborhoodOptions = useMemo(
    () => (neighborhoods.data ?? []).map((n) => ({ value: n.id, label: n.name })),
    [neighborhoods.data],
  )

  if (current.isLoading) {
    return (
      <Stack align="center" py="xl">
        <Loader />
      </Stack>
    )
  }

  if (current.isError) {
    return (
      <Alert color="red" title="Error">
        No se pudo cargar la propiedad del tenant.
      </Alert>
    )
  }

  if (current.data) {
    return <Navigate to={`/properties/${current.data.id}`} replace />
  }

  return (
    <Stack gap="md" maw={640}>
      <PageHeader
        title="Registrar propiedad"
        description="Cada tenant administra una sola propiedad horizontal (copropiedad). Complete los datos para comenzar."
      />

      <form onSubmit={form.onSubmit(() => createMutation.mutate())}>
        <Stack gap="sm">
          <TextInput label="Nombre de la propiedad" required {...form.getInputProps('name')} />
          <TextInput label="Nombre comercial" {...form.getInputProps('tradeName')} />
          <TextInput label="Razón social" {...form.getInputProps('legalName')} />
          <TextInput label="NIT" {...form.getInputProps('nit')} />
          <TextInput label="Régimen tributario" {...form.getInputProps('taxRegime')} />
          <TextInput label="Representante legal" {...form.getInputProps('legalRepresentative')} />
          <TextInput label="Dirección" required {...form.getInputProps('addressLine')} />
          <TextInput label="Ciudad" required {...form.getInputProps('city')} />
          <TextInput label="País" required {...form.getInputProps('country')} />
          <TextInput label="Código postal" {...form.getInputProps('postalCode')} />
          <TextInput label="Teléfono" {...form.getInputProps('phone')} />
          <Select
            label="Barrio"
            clearable
            searchable
            data={neighborhoodOptions}
            comboboxProps={formDrawerSelectComboboxProps}
            value={form.values.neighborhoodId}
            onChange={(v) => form.setFieldValue('neighborhoodId', v)}
          />
          <Select
            label="Uso de la propiedad"
            required
            data={[...PROPERTY_USE_TYPE_OPTIONS]}
            comboboxProps={formDrawerSelectComboboxProps}
            {...form.getInputProps('propertyUseType')}
          />
          <TextInput label="Matrícula inmobiliaria" {...form.getInputProps('matriculaInmobiliaria')} />
          <Textarea label="Notas de reglamento" minRows={2} {...form.getInputProps('regulationNotes')} />
          <Textarea
            label="Notas base de coeficiente"
            minRows={2}
            {...form.getInputProps('coefficientBasisNotes')}
          />
          <Button type="submit" loading={createMutation.isPending}>
            Crear propiedad
          </Button>
        </Stack>
      </form>
    </Stack>
  )
}
