import {
  ActionIcon,
  Alert,
  Button,
  Group,
  NumberInput,
  Select,
  Stack,
  Switch,
  Text,
  TextInput,
} from '@mantine/core'
import { useForm } from '@mantine/form'
import { notifications } from '@mantine/notifications'
import { useMutation, useQuery } from '@tanstack/react-query'
import { useEffect, useMemo, useState } from 'react'
import { api } from '../../../api/client'
import { getApiErrorMessage } from '../../../api/errors'
import type { Building, CoefficientSummary, Floor, Unit } from '../../../api/types'
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
import { usePropertyId } from '../../../hooks/usePropertyId'
import { formDrawerSelectComboboxProps } from '../../../lib/formDrawerSelect'
import { labelForOption, UNIT_TYPE_OPTIONS } from '../../../lib/structureEnums'

export function UnitsPage() {
  const propertyId = usePropertyId()
  const [drawer, setDrawer] = useState<'create' | Unit | null>(null)
  const invalidate = useInvalidate(['units', 'unit-options', 'coefficient-summary'])
  const list = usePagedListState('code', {
    columnFilters: { horizontalPropertyId: propertyId },
  })
  const listQuery = usePagedListQuery<Unit>('units', '/api/Units', list)

  useEffect(() => {
    list.setFilter('horizontalPropertyId', propertyId)
  }, [propertyId, list.setFilter])

  const buildings = useEntityOptions<Building>('building-options', '/api/Buildings', {
    horizontalPropertyId: propertyId,
  })
  const floors = useEntityOptions<Floor>('floor-options', '/api/Floors', {
    horizontalPropertyId: propertyId,
  })
  const units = useEntityOptions<Unit>('unit-options', '/api/Units', {
    horizontalPropertyId: propertyId,
  })

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
      code: '',
      unitType: 'Apartment',
      buildingId: '' as string | null,
      floorId: '' as string | null,
      privateBuiltAreaM2: 0,
      privateOpenAreaM2: null as number | null,
      coefficient: 0,
      contributionModuleCode: '',
      linkedUnitId: '' as string | null,
      isBillable: true,
      isActive: true,
    },
    validate: {
      code: (v) => (v.trim().length < 1 ? 'Required' : null),
      unitType: (v) => (v.trim().length < 1 ? 'Required' : null),
    },
  })

  const buildingOptions = useMemo(
    () => (buildings.data ?? []).map((b) => ({ value: b.id, label: b.name })),
    [buildings.data],
  )

  const floorOptions = useMemo(() => {
    const selectedBuilding = form.values.buildingId
    return (floors.data ?? [])
      .filter((f) => !selectedBuilding || f.buildingId === selectedBuilding)
      .map((f) => ({ value: f.id, label: f.name }))
  }, [floors.data, form.values.buildingId])

  const linkedUnitOptions = useMemo(() => {
    const editingId = drawer !== null && drawer !== 'create' ? drawer.id : null
    return (units.data ?? [])
      .filter((u) => u.id !== editingId)
      .map((u) => ({ value: u.id, label: u.code }))
  }, [units.data, drawer])

  const openCreate = () => {
    form.setValues({
      code: '',
      unitType: 'Apartment',
      buildingId: null,
      floorId: null,
      privateBuiltAreaM2: 0,
      privateOpenAreaM2: null,
      coefficient: 0,
      contributionModuleCode: '',
      linkedUnitId: null,
      isBillable: true,
      isActive: true,
    })
    setDrawer('create')
  }

  const openEdit = (item: Unit) => {
    form.setValues({
      code: item.code,
      unitType: item.unitType,
      buildingId: item.buildingId,
      floorId: item.floorId,
      privateBuiltAreaM2: item.privateBuiltAreaM2,
      privateOpenAreaM2: item.privateOpenAreaM2,
      coefficient: item.coefficient,
      contributionModuleCode: item.contributionModuleCode ?? '',
      linkedUnitId: item.linkedUnitId,
      isBillable: item.isBillable,
      isActive: item.isActive,
    })
    setDrawer(item)
  }

  const saveMutation = useMutation({
    mutationFn: async () => {
      const payload = {
        horizontalPropertyId: propertyId,
        code: form.values.code.trim(),
        unitType: form.values.unitType,
        buildingId: form.values.buildingId || null,
        floorId: form.values.floorId || null,
        privateBuiltAreaM2: Number(form.values.privateBuiltAreaM2) || 0,
        privateOpenAreaM2:
          form.values.privateOpenAreaM2 === null || form.values.privateOpenAreaM2 === undefined
            ? null
            : Number(form.values.privateOpenAreaM2),
        coefficient: Number(form.values.coefficient) || 0,
        contributionModuleCode: form.values.contributionModuleCode.trim() || null,
        linkedUnitId: form.values.linkedUnitId || null,
        isBillable: form.values.isBillable,
      }
      if (drawer === 'create') {
        const { data } = await api.post<Unit>('/api/Units', payload)
        return data
      }
      const { data } = await api.put<Unit>(`/api/Units/${drawer!.id}`, {
        ...payload,
        isActive: form.values.isActive,
      })
      return data
    },
    onSuccess: () => {
      notifications.show({ title: 'Saved', message: 'Unit saved', color: 'teal' })
      setDrawer(null)
      invalidate()
    },
    onError: (err) =>
      notifications.show({ title: 'Error', message: getApiErrorMessage(err), color: 'red' }),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/api/Units/${id}`),
    onSuccess: () => {
      notifications.show({ title: 'Deactivated', message: 'Unit deactivated', color: 'gray' })
      invalidate()
    },
    onError: (err) =>
      notifications.show({ title: 'Error', message: getApiErrorMessage(err), color: 'red' }),
  })

  const columns = useMemo((): ColumnDef<Unit>[] => {
    return [
      {
        key: 'code',
        header: 'Code',
        sortKey: 'code',
        filter: 'text',
        filterKey: 'code',
        render: (row) => (
          <Text size="sm" fw={500}>
            {row.code}
          </Text>
        ),
      },
      {
        key: 'unitType',
        header: 'Type',
        sortKey: 'unittype',
        filter: 'select',
        filterKey: 'unitType',
        filterOptions: UNIT_TYPE_OPTIONS.map((o) => ({ value: o.value, label: o.label })),
        render: (row) => labelForOption(UNIT_TYPE_OPTIONS, row.unitType),
      },
      {
        key: 'coefficient',
        header: 'Coefficient',
        sortKey: 'coefficient',
        filter: 'none',
        render: (row) => row.coefficient.toFixed(4),
      },
      {
        key: 'isBillable',
        header: 'Billable',
        filter: 'none',
        render: (row) => (row.isBillable ? 'Yes' : 'No'),
      },
      activeColumn<Unit>(),
      {
        key: 'actions',
        header: '',
        filter: 'none',
        width: 88,
        render: (row) => (
          <Group gap={4} wrap="nowrap">
            <ActionIcon variant="light" size="md" onClick={() => openEdit(row)} aria-label="Edit">
              ✎
            </ActionIcon>
            <ActionIcon
              variant="light"
              color="red"
              size="md"
              onClick={() => {
                if (window.confirm(`Deactivate "${row.code}"?`)) deleteMutation.mutate(row.id)
              }}
              aria-label="Delete"
            >
              ✕
            </ActionIcon>
          </Group>
        ),
      },
    ]
  }, [deleteMutation])

  const remaining = summaryQuery.data?.remainingToHundred

  return (
    <Stack gap="md">
      <PageHeader
        title="Units"
        description="Private units and their coefficients for this property."
      />
      {remaining !== undefined && (
        <Alert color={remaining === 0 ? 'teal' : 'amber'} title="Coefficient balance">
          Remaining to 100: <strong>{remaining.toFixed(4)}</strong>
          {summaryQuery.data
            ? ` · Total ${summaryQuery.data.totalCoefficient.toFixed(4)} across ${summaryQuery.data.unitCount} units`
            : null}
        </Alert>
      )}
      <ListToolbar
        onAdd={openCreate}
        addLabel="Add unit"
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
        onClearColumnFilters={() => {
          list.clearColumnFilters()
          list.setFilter('horizontalPropertyId', propertyId)
        }}
        onSearchChange={list.setSearch}
        onPageChange={list.setPage}
        onPageSizeChange={list.setPageSize}
        renderCard={(item) => (
          <EntityCard
            key={item.id}
            title={item.code}
            subtitle={`${labelForOption(UNIT_TYPE_OPTIONS, item.unitType)} · coeff ${item.coefficient.toFixed(4)}`}
            inactive={!item.isActive}
            onEdit={() => openEdit(item)}
            onDelete={() => {
              if (window.confirm(`Deactivate "${item.code}"?`)) deleteMutation.mutate(item.id)
            }}
          />
        )}
      />

      <FormDrawer
        opened={drawer !== null}
        onClose={() => setDrawer(null)}
        title={drawer === 'create' ? 'New unit' : 'Edit unit'}
      >
        <form onSubmit={form.onSubmit(() => saveMutation.mutate())}>
          <Stack gap="sm">
            {remaining !== undefined && (
              <Text size="xs" c="dimmed">
                Remaining coefficient to 100: {remaining.toFixed(4)}
              </Text>
            )}
            <TextInput label="Code" required {...form.getInputProps('code')} />
            <Select
              label="Unit type"
              required
              data={[...UNIT_TYPE_OPTIONS]}
              comboboxProps={formDrawerSelectComboboxProps}
              {...form.getInputProps('unitType')}
            />
            <Select
              label="Building"
              clearable
              searchable
              data={buildingOptions}
              comboboxProps={formDrawerSelectComboboxProps}
              value={form.values.buildingId}
              onChange={(v) => {
                form.setFieldValue('buildingId', v)
                form.setFieldValue('floorId', null)
              }}
            />
            <Select
              label="Floor"
              clearable
              searchable
              data={floorOptions}
              disabled={!form.values.buildingId}
              comboboxProps={formDrawerSelectComboboxProps}
              value={form.values.floorId}
              onChange={(v) => form.setFieldValue('floorId', v)}
            />
            <NumberInput
              label="Private built area (m²)"
              decimalScale={2}
              {...form.getInputProps('privateBuiltAreaM2')}
            />
            <NumberInput
              label="Private open area (m²)"
              decimalScale={2}
              value={form.values.privateOpenAreaM2 ?? ''}
              onChange={(v) =>
                form.setFieldValue('privateOpenAreaM2', typeof v === 'number' ? v : null)
              }
            />
            <NumberInput
              label="Coefficient"
              decimalScale={6}
              {...form.getInputProps('coefficient')}
            />
            <TextInput
              label="Contribution module code"
              {...form.getInputProps('contributionModuleCode')}
            />
            <Select
              label="Linked unit"
              clearable
              searchable
              data={linkedUnitOptions}
              comboboxProps={formDrawerSelectComboboxProps}
              value={form.values.linkedUnitId}
              onChange={(v) => form.setFieldValue('linkedUnitId', v)}
            />
            <Switch label="Billable" {...form.getInputProps('isBillable', { type: 'checkbox' })} />
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
