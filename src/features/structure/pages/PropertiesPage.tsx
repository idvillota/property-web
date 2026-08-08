import {
  ActionIcon,
  Button,
  Group,
  Select,
  Stack,
  Switch,
  Text,
  Textarea,
  TextInput,
} from '@mantine/core'
import { useForm } from '@mantine/form'
import { notifications } from '@mantine/notifications'
import { IconExternalLink } from '@tabler/icons-react'
import { useMutation } from '@tanstack/react-query'
import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../../../api/client'
import { getApiErrorMessage } from '../../../api/errors'
import type { HorizontalProperty, Neighborhood } from '../../../api/types'
import { EntityCard } from '../../../components/crud/EntityCard'
import { FormDrawer } from '../../../components/crud/FormDrawer'
import { ListToolbar } from '../../../components/crud/ListToolbar'
import { PagedEntityView } from '../../../components/data-table/PagedEntityView'
import { activeColumn } from '../../../components/data-table/tableColumns'
import type { ColumnDef } from '../../../components/data-table/types'
import { PageHeader } from '../../../components/shared/PageHeader'
import { useEntityOptions } from '../../../hooks/useEntityOptions'
import { useInvalidate } from '../../../hooks/useInvalidate'
import { usePagedListQuery } from '../../../hooks/usePagedListQuery'
import { usePagedListState } from '../../../hooks/usePagedListState'
import { formDrawerSelectComboboxProps } from '../../../lib/formDrawerSelect'
import {
  labelForOption,
  PROPERTY_USE_TYPE_OPTIONS,
} from '../../../lib/structureEnums'

export function PropertiesPage() {
  const navigate = useNavigate()
  const [drawer, setDrawer] = useState<'create' | HorizontalProperty | null>(null)
  const invalidate = useInvalidate(['horizontal-properties', 'horizontal-property'])
  const list = usePagedListState('name')
  const listQuery = usePagedListQuery<HorizontalProperty>(
    'horizontal-properties',
    '/api/HorizontalProperties',
    list,
  )
  const neighborhoods = useEntityOptions<Neighborhood>('neighborhood-options', '/api/Neighborhoods')

  const form = useForm({
    initialValues: {
      name: '',
      tradeName: '',
      nit: '',
      addressLine: '',
      city: '',
      country: 'Colombia',
      neighborhoodId: '' as string | null,
      propertyUseType: 'Residential',
      matriculaInmobiliaria: '',
      regulationNotes: '',
      coefficientBasisNotes: '',
      isActive: true,
    },
    validate: {
      name: (v) => (v.trim().length < 1 ? 'Required' : null),
      addressLine: (v) => (v.trim().length < 1 ? 'Required' : null),
      city: (v) => (v.trim().length < 1 ? 'Required' : null),
      country: (v) => (v.trim().length < 1 ? 'Required' : null),
      propertyUseType: (v) => (v.trim().length < 1 ? 'Required' : null),
    },
  })

  const openCreate = () => {
    form.setValues({
      name: '',
      tradeName: '',
      nit: '',
      addressLine: '',
      city: '',
      country: 'Colombia',
      neighborhoodId: null,
      propertyUseType: 'Residential',
      matriculaInmobiliaria: '',
      regulationNotes: '',
      coefficientBasisNotes: '',
      isActive: true,
    })
    setDrawer('create')
  }

  const openEdit = (item: HorizontalProperty) => {
    form.setValues({
      name: item.name,
      tradeName: item.tradeName ?? '',
      nit: item.nit ?? '',
      addressLine: item.addressLine,
      city: item.city,
      country: item.country,
      neighborhoodId: item.neighborhoodId,
      propertyUseType: item.propertyUseType,
      matriculaInmobiliaria: item.matriculaInmobiliaria ?? '',
      regulationNotes: item.regulationNotes ?? '',
      coefficientBasisNotes: item.coefficientBasisNotes ?? '',
      isActive: item.isActive,
    })
    setDrawer(item)
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
        neighborhoodId: form.values.neighborhoodId || null,
        propertyUseType: form.values.propertyUseType,
        matriculaInmobiliaria: form.values.matriculaInmobiliaria.trim() || null,
        regulationNotes: form.values.regulationNotes.trim() || null,
        coefficientBasisNotes: form.values.coefficientBasisNotes.trim() || null,
      }
      if (drawer === 'create') {
        const { data } = await api.post<HorizontalProperty>('/api/HorizontalProperties', payload)
        return data
      }
      const { data } = await api.put<HorizontalProperty>(`/api/HorizontalProperties/${drawer!.id}`, {
        ...payload,
        isActive: form.values.isActive,
      })
      return data
    },
    onSuccess: () => {
      notifications.show({ title: 'Saved', message: 'Property saved', color: 'teal' })
      setDrawer(null)
      invalidate()
    },
    onError: (err) =>
      notifications.show({ title: 'Error', message: getApiErrorMessage(err), color: 'red' }),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/api/HorizontalProperties/${id}`),
    onSuccess: () => {
      notifications.show({ title: 'Deactivated', message: 'Property deactivated', color: 'gray' })
      invalidate()
    },
    onError: (err) =>
      notifications.show({ title: 'Error', message: getApiErrorMessage(err), color: 'red' }),
  })

  const neighborhoodOptions = useMemo(
    () => (neighborhoods.data ?? []).map((n) => ({ value: n.id, label: n.name })),
    [neighborhoods.data],
  )

  const columns = useMemo((): ColumnDef<HorizontalProperty>[] => {
    return [
      {
        key: 'name',
        header: 'Name',
        sortKey: 'name',
        filter: 'text',
        filterKey: 'name',
        render: (row) => (
          <Text
            size="sm"
            fw={500}
            style={{ cursor: 'pointer' }}
            onClick={() => navigate(`/properties/${row.id}`)}
          >
            {row.name}
          </Text>
        ),
      },
      {
        key: 'city',
        header: 'City',
        sortKey: 'city',
        filter: 'text',
        filterKey: 'city',
        render: (row) => row.city,
      },
      {
        key: 'propertyUseType',
        header: 'Use',
        sortKey: 'propertyusetype',
        filter: 'select',
        filterKey: 'propertyUseType',
        filterOptions: PROPERTY_USE_TYPE_OPTIONS.map((o) => ({ value: o.value, label: o.label })),
        render: (row) => labelForOption(PROPERTY_USE_TYPE_OPTIONS, row.propertyUseType),
      },
      activeColumn<HorizontalProperty>(),
      {
        key: 'actions',
        header: '',
        filter: 'none',
        width: 120,
        render: (row) => (
          <Group gap={4} wrap="nowrap">
            <ActionIcon
              variant="light"
              size="md"
              onClick={() => navigate(`/properties/${row.id}`)}
              aria-label="Open"
            >
              <IconExternalLink size={16} stroke={1.75} />
            </ActionIcon>
            <ActionIcon variant="light" size="md" onClick={() => openEdit(row)} aria-label="Edit">
              ✎
            </ActionIcon>
            <ActionIcon
              variant="light"
              color="red"
              size="md"
              onClick={() => {
                if (window.confirm(`Deactivate "${row.name}"?`)) deleteMutation.mutate(row.id)
              }}
              aria-label="Delete"
            >
              ✕
            </ActionIcon>
          </Group>
        ),
      },
    ]
  }, [deleteMutation, navigate])

  return (
    <Stack gap="md">
      <PageHeader
        title="Properties"
        description="Horizontal properties (conjuntos / edificios). Open a property to manage buildings, floors, units, and occupancies."
      />
      <ListToolbar
        onAdd={openCreate}
        addLabel="Add property"
        includeInactive={list.state.includeInactive}
        onIncludeInactiveChange={list.setIncludeInactive}
      />
      <PagedEntityView
        loading={listQuery.isLoading}
        data={listQuery.data}
        columns={columns}
        listState={list.state}
        onToggleSort={list.toggleSort}
        onColumnFilter={list.setColumnFilter}
        onClearColumnFilters={list.clearColumnFilters}
        onSearchChange={list.setSearch}
        onPageChange={list.setPage}
        onPageSizeChange={list.setPageSize}
        renderCard={(item) => (
          <EntityCard
            key={item.id}
            title={item.name}
            subtitle={`${item.city} · ${labelForOption(PROPERTY_USE_TYPE_OPTIONS, item.propertyUseType)}`}
            inactive={!item.isActive}
            meta={
              <Button
                size="compact-xs"
                variant="subtle"
                onClick={() => navigate(`/properties/${item.id}`)}
              >
                Open workspace
              </Button>
            }
            onEdit={() => openEdit(item)}
            onDelete={() => {
              if (window.confirm(`Deactivate "${item.name}"?`)) deleteMutation.mutate(item.id)
            }}
          />
        )}
      />

      <FormDrawer
        opened={drawer !== null}
        onClose={() => setDrawer(null)}
        title={drawer === 'create' ? 'New property' : 'Edit property'}
      >
        <form onSubmit={form.onSubmit(() => saveMutation.mutate())}>
          <Stack gap="sm">
            <TextInput label="Name" required {...form.getInputProps('name')} />
            <TextInput label="Trade name" {...form.getInputProps('tradeName')} />
            <TextInput label="NIT" {...form.getInputProps('nit')} />
            <TextInput label="Address" required {...form.getInputProps('addressLine')} />
            <TextInput label="City" required {...form.getInputProps('city')} />
            <TextInput label="Country" required {...form.getInputProps('country')} />
            <Select
              label="Neighborhood"
              clearable
              searchable
              data={neighborhoodOptions}
              comboboxProps={formDrawerSelectComboboxProps}
              value={form.values.neighborhoodId}
              onChange={(v) => form.setFieldValue('neighborhoodId', v)}
            />
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
            {drawer !== 'create' && (
              <Switch label="Active" {...form.getInputProps('isActive', { type: 'checkbox' })} />
            )}
            <Button type="submit" fullWidth loading={saveMutation.isPending}>
              Save
            </Button>
          </Stack>
        </form>
      </FormDrawer>
    </Stack>
  )
}
