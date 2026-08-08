import {
  Anchor,
  Button,
  Group,
  Select,
  SimpleGrid,
  Stack,
  Switch,
  Text,
  Textarea,
  TextInput,
  ThemeIcon,
  Title,
} from '@mantine/core'
import { useForm } from '@mantine/form'
import { notifications } from '@mantine/notifications'
import {
  IconBuilding,
  IconCalendarEvent,
  IconCash,
  IconCreditCard,
  IconDoor,
  IconLayersIntersect,
  IconPackage,
  IconPool,
  IconReceipt,
  IconCalendarCheck,
  IconUsersGroup,
} from '@tabler/icons-react'
import { useMutation, useQuery } from '@tanstack/react-query'
import { useMemo, useState } from 'react'
import { Link, useOutletContext } from 'react-router-dom'
import { api } from '../../../api/client'
import { getApiErrorMessage } from '../../../api/errors'
import type { CoefficientSummary, HorizontalProperty } from '../../../api/types'
import { FormDrawer } from '../../../components/crud/FormDrawer'
import { useInvalidate } from '../../../hooks/useInvalidate'
import { usePropertyId } from '../../../hooks/usePropertyId'
import { formDrawerSelectComboboxProps } from '../../../lib/formDrawerSelect'
import { FeatureCodes } from '../../../lib/permissions'
import { labelForOption, PROPERTY_USE_TYPE_OPTIONS } from '../../../lib/structureEnums'
import { useAuthStore } from '../../../stores/authStore'
import type { PropertyWorkspaceContext } from '../layouts/PropertyWorkspaceLayout'

const LINKS = [
  {
    to: 'buildings',
    label: 'Buildings',
    description: 'Towers and blocks',
    icon: IconBuilding,
    permission: FeatureCodes.structureBuildings,
  },
  {
    to: 'floors',
    label: 'Floors',
    description: 'Levels within buildings',
    icon: IconLayersIntersect,
    permission: FeatureCodes.structureFloors,
  },
  {
    to: 'units',
    label: 'Units',
    description: 'Apartments, parking, storage',
    icon: IconDoor,
    permission: FeatureCodes.structureUnits,
  },
  {
    to: 'occupancies',
    label: 'Occupancies',
    description: 'Owners, tenants, residents',
    icon: IconUsersGroup,
    permission: FeatureCodes.peopleManage,
  },
  {
    to: 'billing',
    label: 'Billing settings',
    description: 'Budget, due day, late interest',
    icon: IconCash,
    permission: FeatureCodes.billingSettings,
  },
  {
    to: 'periods',
    label: 'Billing periods',
    description: 'Open months and generate fees',
    icon: IconCalendarEvent,
    permission: FeatureCodes.billingCharges,
  },
  {
    to: 'charges',
    label: 'Fee charges',
    description: 'Ordinary, interest, adjustments',
    icon: IconReceipt,
    permission: FeatureCodes.billingCharges,
  },
  {
    to: 'payments',
    label: 'Payments',
    description: 'Record and allocate payments',
    icon: IconCreditCard,
    permission: FeatureCodes.billingPayments,
  },
  {
    to: 'common-areas',
    label: 'Common areas',
    description: 'Amenities available to reserve',
    icon: IconPool,
    permission: FeatureCodes.amenitiesAreas,
  },
  {
    to: 'reservations',
    label: 'Reservations',
    description: 'Book common areas',
    icon: IconCalendarCheck,
    permission: FeatureCodes.amenitiesReservations,
  },
  {
    to: 'reception',
    label: 'Reception',
    description: 'Packages, letters, messages',
    icon: IconPackage,
    permission: FeatureCodes.receptionManage,
  },
] as const

export function PropertyOverviewPage() {
  const propertyId = usePropertyId()
  const { property } = useOutletContext<PropertyWorkspaceContext>()
  const [editOpen, setEditOpen] = useState(false)
  const invalidate = useInvalidate(['horizontal-properties', 'horizontal-property', 'coefficient-summary'])

  const summaryQuery = useQuery({
    queryKey: ['coefficient-summary', propertyId],
    queryFn: async () => {
      const { data } = await api.get<CoefficientSummary>(
        `/api/Units/coefficient-summary?horizontalPropertyId=${encodeURIComponent(propertyId)}`,
      )
      return data
    },
  })

  const form = useForm({
    initialValues: {
      name: property.name,
      tradeName: property.tradeName ?? '',
      nit: property.nit ?? '',
      addressLine: property.addressLine,
      city: property.city,
      country: property.country,
      propertyUseType: property.propertyUseType,
      matriculaInmobiliaria: property.matriculaInmobiliaria ?? '',
      regulationNotes: property.regulationNotes ?? '',
      coefficientBasisNotes: property.coefficientBasisNotes ?? '',
      isActive: property.isActive,
    },
    validate: {
      name: (v) => (v.trim().length < 1 ? 'Required' : null),
      addressLine: (v) => (v.trim().length < 1 ? 'Required' : null),
      city: (v) => (v.trim().length < 1 ? 'Required' : null),
    },
  })

  const openEdit = () => {
    form.setValues({
      name: property.name,
      tradeName: property.tradeName ?? '',
      nit: property.nit ?? '',
      addressLine: property.addressLine,
      city: property.city,
      country: property.country,
      propertyUseType: property.propertyUseType,
      matriculaInmobiliaria: property.matriculaInmobiliaria ?? '',
      regulationNotes: property.regulationNotes ?? '',
      coefficientBasisNotes: property.coefficientBasisNotes ?? '',
      isActive: property.isActive,
    })
    setEditOpen(true)
  }

  const saveMutation = useMutation({
    mutationFn: async () => {
      const payload = {
        name: form.values.name.trim(),
        tradeName: form.values.tradeName.trim() || null,
        nit: form.values.nit.trim() || null,
        addressLine: form.values.addressLine.trim(),
        city: form.values.city.trim(),
        country: form.values.country.trim(),
        neighborhoodId: property.neighborhoodId,
        propertyUseType: form.values.propertyUseType,
        matriculaInmobiliaria: form.values.matriculaInmobiliaria.trim() || null,
        regulationNotes: form.values.regulationNotes.trim() || null,
        coefficientBasisNotes: form.values.coefficientBasisNotes.trim() || null,
        isActive: form.values.isActive,
      }
      const { data } = await api.put<HorizontalProperty>(
        `/api/HorizontalProperties/${propertyId}`,
        payload,
      )
      return data
    },
    onSuccess: () => {
      notifications.show({ title: 'Saved', message: 'Property updated', color: 'teal' })
      setEditOpen(false)
      invalidate()
    },
    onError: (err) =>
      notifications.show({ title: 'Error', message: getApiErrorMessage(err), color: 'red' }),
  })

  const permissions = useAuthStore((s) => s.permissions)
  const visibleLinks = useMemo(
    () => LINKS.filter((item) => permissions.includes(item.permission)),
    [permissions],
  )
  const summary = summaryQuery.data

  return (
    <Stack gap="lg">
      <Group justify="space-between" align="flex-start">
        <Stack gap={4}>
          <Text size="sm" c="dimmed">
            {property.addressLine}, {property.city}
          </Text>
          <Text size="sm">
            Use: {labelForOption(PROPERTY_USE_TYPE_OPTIONS, property.propertyUseType)}
            {property.nit ? ` · NIT ${property.nit}` : ''}
          </Text>
        </Stack>
        <Button variant="light" onClick={openEdit}>
          Edit basics
        </Button>
      </Group>

      <SimpleGrid cols={{ base: 1, sm: 3 }} spacing="md">
        <Stack gap={2}>
          <Text size="xs" c="dimmed" tt="uppercase">
            Total coefficient
          </Text>
          <Title order={3}>{summary ? summary.totalCoefficient.toFixed(5) : '—'}</Title>
        </Stack>
        <Stack gap={2}>
          <Text size="xs" c="dimmed" tt="uppercase">
            Units
          </Text>
          <Title order={3}>{summary?.unitCount ?? '—'}</Title>
        </Stack>
        <Stack gap={2}>
          <Text size="xs" c="dimmed" tt="uppercase">
            Remaining to 100
          </Text>
          <Title order={3} c={(summary?.remainingToHundred ?? 0) === 0 ? 'teal' : undefined}>
            {summary ? summary.remainingToHundred.toFixed(5) : '—'}
          </Title>
        </Stack>
      </SimpleGrid>

      <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="md">
        {visibleLinks.map((item) => (
          <Anchor
            key={item.to}
            component={Link}
            to={`/properties/${propertyId}/${item.to}`}
            underline="never"
            c="inherit"
          >
            <Group gap="sm" align="flex-start" wrap="nowrap">
              <ThemeIcon variant="light" size="lg" radius="md">
                <item.icon size={18} stroke={1.75} />
              </ThemeIcon>
              <Stack gap={2}>
                <Text fw={600} size="sm">
                  {item.label}
                </Text>
                <Text size="xs" c="dimmed">
                  {item.description}
                </Text>
              </Stack>
            </Group>
          </Anchor>
        ))}
      </SimpleGrid>

      <FormDrawer opened={editOpen} onClose={() => setEditOpen(false)} title="Edit property">
        <form onSubmit={form.onSubmit(() => saveMutation.mutate())}>
          <Stack gap="sm">
            <TextInput label="Name" required {...form.getInputProps('name')} />
            <TextInput label="Trade name" {...form.getInputProps('tradeName')} />
            <TextInput label="NIT" {...form.getInputProps('nit')} />
            <TextInput label="Address" required {...form.getInputProps('addressLine')} />
            <TextInput label="City" required {...form.getInputProps('city')} />
            <TextInput label="Country" required {...form.getInputProps('country')} />
            <Select
              label="Property use"
              required
              data={[...PROPERTY_USE_TYPE_OPTIONS]}
              comboboxProps={formDrawerSelectComboboxProps}
              {...form.getInputProps('propertyUseType')}
            />
            <TextInput label="Matrícula inmobiliaria" {...form.getInputProps('matriculaInmobiliaria')} />
            <Textarea label="Regulation notes" minRows={2} {...form.getInputProps('regulationNotes')} />
            <Textarea
              label="Coefficient basis notes"
              minRows={2}
              {...form.getInputProps('coefficientBasisNotes')}
            />
            <Switch label="Active" {...form.getInputProps('isActive', { type: 'checkbox' })} />
            <Button type="submit" fullWidth loading={saveMutation.isPending}>
              Save
            </Button>
          </Stack>
        </form>
      </FormDrawer>
    </Stack>
  )
}
