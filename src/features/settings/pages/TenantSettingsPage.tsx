import { Button, Stack, TextInput } from '@mantine/core'
import { useForm } from '@mantine/form'
import { notifications } from '@mantine/notifications'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useEffect } from 'react'
import { api } from '../../../api/client'
import { getApiErrorMessage } from '../../../api/errors'
import type { TenantSettings } from '../../../api/types'
import { PageHeader } from '../../../components/shared/PageHeader'

const emptySettings = {
  tradeName: '',
  legalName: '',
  taxRegime: '',
  taxId: '',
  legalRepresentative: '',
  addressLine: '',
  city: '',
  country: '',
  postalCode: '',
  phone: '',
}

export function TenantSettingsPage() {
  const queryClient = useQueryClient()

  const settingsQuery = useQuery({
    queryKey: ['tenantSettings'],
    queryFn: async () => {
      const { data } = await api.get<TenantSettings>('/api/tenant/settings')
      return data
    },
  })

  const form = useForm({
    initialValues: emptySettings,
  })

  useEffect(() => {
    if (settingsQuery.data) {
      const s = settingsQuery.data
      form.setValues({
        tradeName: s.tradeName,
        legalName: s.legalName,
        taxRegime: s.taxRegime,
        taxId: s.taxId,
        legalRepresentative: s.legalRepresentative ?? '',
        addressLine: s.addressLine,
        city: s.city,
        country: s.country,
        postalCode: s.postalCode ?? '',
        phone: s.phone ?? '',
      })
    }
  }, [settingsQuery.data])

  const saveMutation = useMutation({
    mutationFn: async () => {
      const { data } = await api.put<TenantSettings>('/api/tenant/settings', {
        tradeName: form.values.tradeName,
        legalName: form.values.legalName,
        taxRegime: form.values.taxRegime,
        taxId: form.values.taxId,
        legalRepresentative: form.values.legalRepresentative || null,
        addressLine: form.values.addressLine,
        city: form.values.city,
        country: form.values.country,
        postalCode: form.values.postalCode || null,
        phone: form.values.phone || null,
      })
      return data
    },
    onSuccess: (data) => {
      queryClient.setQueryData(['tenantSettings'], data)
      notifications.show({ title: 'Saved', message: 'Tenant settings updated', color: 'teal' })
    },
    onError: (err) =>
      notifications.show({ title: 'Error', message: getApiErrorMessage(err), color: 'red' }),
  })

  return (
    <Stack gap="lg" maw={640}>
      <PageHeader
        title="Tenant settings"
        description="Legal identity and contact details for this tenant"
      />

      <TextInput label="Trade name" {...form.getInputProps('tradeName')} />
      <TextInput label="Legal name" {...form.getInputProps('legalName')} />
      <TextInput label="Tax regime" {...form.getInputProps('taxRegime')} />
      <TextInput label="Tax ID" {...form.getInputProps('taxId')} />
      <TextInput label="Legal representative" {...form.getInputProps('legalRepresentative')} />
      <TextInput label="Address" {...form.getInputProps('addressLine')} />
      <TextInput label="City" {...form.getInputProps('city')} />
      <TextInput label="Country" {...form.getInputProps('country')} />
      <TextInput label="Postal code" {...form.getInputProps('postalCode')} />
      <TextInput label="Phone" {...form.getInputProps('phone')} />

      <Button loading={saveMutation.isPending} onClick={() => saveMutation.mutate()}>
        Save
      </Button>
    </Stack>
  )
}
