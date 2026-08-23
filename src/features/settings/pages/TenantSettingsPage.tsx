import {
  Alert,
  Anchor,
  Button,
  Divider,
  Loader,
  Select,
  Stack,
  Switch,
  Text,
  Textarea,
  TextInput,
  Title,
} from '@mantine/core'
import { useForm } from '@mantine/form'
import { notifications } from '@mantine/notifications'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useEffect, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../../../api/client'
import { getApiErrorMessage } from '../../../api/errors'
import type { Neighborhood, TenantSettings } from '../../../api/types'
import { PageHeader } from '../../../components/shared/PageHeader'
import { useEntityOptions } from '../../../hooks/useEntityOptions'
import { formDrawerSelectComboboxProps } from '../../../lib/formDrawerSelect'
import { PROPERTY_USE_TYPE_OPTIONS } from '../../../lib/structureEnums'
import { useAuthStore } from '../../../stores/authStore'
import { DEFAULT_TENANT_MODULES } from '../lib/tenantModuleFlags'

/** Tenant configuration = the single property profile (Colombia 1:1 model). */
export function TenantSettingsPage() {
  const queryClient = useQueryClient()
  const setModules = useAuthStore((s) => s.setModules)
  const neighborhoods = useEntityOptions<Neighborhood>('neighborhood-options', '/api/Neighborhoods')

  const settingsQuery = useQuery({
    queryKey: ['tenantSettings'],
    queryFn: async () => {
      const { data } = await api.get<TenantSettings>('/api/tenant/settings')
      return data
    },
  })

  const form = useForm({
    initialValues: {
      name: '',
      tradeName: '',
      legalName: '',
      taxRegime: '',
      taxId: '',
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
      isActive: true,
      modulePortal: true,
      moduleDigitalPayments: false,
      moduleAccounting: false,
      moduleVisits: false,
      moduleAssemblies: false,
    },
    validate: {
      name: (v) => (v.trim().length < 1 ? 'Obligatorio' : null),
      addressLine: (v) => (v.trim().length < 1 ? 'Obligatorio' : null),
      city: (v) => (v.trim().length < 1 ? 'Obligatorio' : null),
      country: (v) => (v.trim().length < 1 ? 'Obligatorio' : null),
    },
  })

  useEffect(() => {
    const s = settingsQuery.data
    if (!s?.hasProperty) return
    const m = s.modules ?? DEFAULT_TENANT_MODULES
    form.setValues({
      name: s.name,
      tradeName: s.tradeName,
      legalName: s.legalName,
      taxRegime: s.taxRegime,
      taxId: s.taxId,
      legalRepresentative: s.legalRepresentative ?? '',
      addressLine: s.addressLine,
      city: s.city,
      country: s.country || 'Colombia',
      postalCode: s.postalCode ?? '',
      phone: s.phone ?? '',
      neighborhoodId: s.neighborhoodId,
      propertyUseType: s.propertyUseType ?? 'Residential',
      matriculaInmobiliaria: s.matriculaInmobiliaria ?? '',
      regulationNotes: s.regulationNotes ?? '',
      coefficientBasisNotes: s.coefficientBasisNotes ?? '',
      isActive: s.isActive,
      modulePortal: m.portal,
      moduleDigitalPayments: m.digitalPayments,
      moduleAccounting: m.accounting,
      moduleVisits: m.visits,
      moduleAssemblies: m.assemblies,
    })
  }, [settingsQuery.data])

  const saveMutation = useMutation({
    mutationFn: async () => {
      const { data } = await api.put<TenantSettings>('/api/tenant/settings', {
        name: form.values.name.trim(),
        tradeName: form.values.tradeName.trim(),
        legalName: form.values.legalName.trim(),
        taxRegime: form.values.taxRegime.trim(),
        taxId: form.values.taxId.trim(),
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
        isActive: form.values.isActive,
        modules: {
          portal: form.values.modulePortal,
          digitalPayments: form.values.moduleDigitalPayments,
          accounting: form.values.moduleAccounting,
          visits: form.values.moduleVisits,
          assemblies: form.values.moduleAssemblies,
        },
      })
      return data
    },
    onSuccess: (data) => {
      queryClient.setQueryData(['tenantSettings'], data)
      void queryClient.invalidateQueries({ queryKey: ['horizontal-property'] })
      void queryClient.invalidateQueries({ queryKey: ['horizontal-properties'] })
      void queryClient.invalidateQueries({ queryKey: ['tenantModules'] })
      if (data.modules) setModules(data.modules)
      notifications.show({
        title: 'Guardado',
        message: 'Datos del conjunto y módulos actualizados. El menú se actualiza al instante (sin re-login).',
        color: 'teal',
      })
    },
    onError: (err) =>
      notifications.show({ title: 'Error', message: getApiErrorMessage(err), color: 'red' }),
  })

  const neighborhoodOptions = useMemo(
    () => (neighborhoods.data ?? []).map((n) => ({ value: n.id, label: n.name })),
    [neighborhoods.data],
  )

  if (settingsQuery.isLoading) {
    return (
      <Stack align="center" py="xl">
        <Loader />
      </Stack>
    )
  }

  if (!settingsQuery.data?.hasProperty) {
    return (
      <Stack gap="md" maw={640}>
        <PageHeader
          title="Datos del conjunto"
          description="Datos legales y de la copropiedad de este tenant"
        />
        <Alert color="yellow" title="Sin propiedad">
          Primero registre la propiedad del tenant.{' '}
          <Anchor component={Link} to="/properties">
            Ir a registrar propiedad
          </Anchor>
        </Alert>
      </Stack>
    )
  }

  return (
    <Stack gap="lg" maw={640}>
      <PageHeader
        title="Datos del conjunto"
        description="Identidad legal y datos de la propiedad (un tenant = una copropiedad)"
      />

      <form onSubmit={form.onSubmit(() => saveMutation.mutate())}>
        <Stack gap="sm">
          <TextInput label="Nombre de la propiedad" required {...form.getInputProps('name')} />
          <TextInput label="Nombre comercial" {...form.getInputProps('tradeName')} />
          <TextInput label="Razón social" {...form.getInputProps('legalName')} />
          <TextInput label="NIT" {...form.getInputProps('taxId')} />
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
          <Switch label="Activo" {...form.getInputProps('isActive', { type: 'checkbox' })} />

          <Divider my="sm" />
          <Title order={4}>Módulos del tenant</Title>
          <Text size="sm" c="dimmed">
            Empaquetado comercial independiente de los permisos de rol. Los cambios aplican al menú sin
            volver a iniciar sesión.
          </Text>
          <Switch label="Portal residentes" {...form.getInputProps('modulePortal', { type: 'checkbox' })} />
          <Switch
            label="Pagos digitales"
            {...form.getInputProps('moduleDigitalPayments', { type: 'checkbox' })}
          />
          <Switch label="Contabilidad" {...form.getInputProps('moduleAccounting', { type: 'checkbox' })} />
          <Switch label="Visitas" {...form.getInputProps('moduleVisits', { type: 'checkbox' })} />
          <Switch label="Asambleas" {...form.getInputProps('moduleAssemblies', { type: 'checkbox' })} />

          <Button type="submit" loading={saveMutation.isPending}>
            Guardar
          </Button>
        </Stack>
      </form>
    </Stack>
  )
}
