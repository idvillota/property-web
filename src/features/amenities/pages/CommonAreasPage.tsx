import {
  ActionIcon,
  Button,
  Group,
  NumberInput,
  Select,
  Stack,
  Switch,
  Text,
  Textarea,
  TextInput,
} from '@mantine/core'
import { useForm } from '@mantine/form'
import { notifications } from '@mantine/notifications'
import { useMutation } from '@tanstack/react-query'
import { useEffect, useMemo, useState } from 'react'
import { api } from '../../../api/client'
import { getApiErrorMessage } from '../../../api/errors'
import type { CommonArea } from '../../../api/types'
import { EntityCard } from '../../../components/crud/EntityCard'
import { FormDrawer } from '../../../components/crud/FormDrawer'
import { ListToolbar } from '../../../components/crud/ListToolbar'
import { PagedEntityView } from '../../../components/data-table/PagedEntityView'
import { activeColumn } from '../../../components/data-table/tableColumns'
import type { ColumnDef } from '../../../components/data-table/types'
import { MoneyInput } from '../../../components/shared/MoneyInput'
import { PageHeader } from '../../../components/shared/PageHeader'
import { useInvalidate } from '../../../hooks/useInvalidate'
import { usePagedListQuery } from '../../../hooks/usePagedListQuery'
import { usePagedListState } from '../../../hooks/usePagedListState'
import { usePropertyId } from '../../../hooks/usePropertyId'
import {
  asEnumName,
  COMMON_AREA_TYPE_OPTIONS,
  enumIndex,
  labelForOption,
} from '../../../lib/amenitiesEnums'
import { formDrawerSelectComboboxProps } from '../../../lib/formDrawerSelect'
import { formatMoney } from '../../../lib/money'

export function CommonAreasPage() {
  const propertyId = usePropertyId()
  const [drawer, setDrawer] = useState<'create' | CommonArea | null>(null)
  const invalidate = useInvalidate(['common-areas', 'common-area-options'])
  const list = usePagedListState('name', {
    columnFilters: { horizontalPropertyId: propertyId },
  })
  const listQuery = usePagedListQuery<CommonArea>('common-areas', '/api/CommonAreas', list)

  useEffect(() => {
    list.setFilter('horizontalPropertyId', propertyId)
  }, [propertyId, list.setFilter])

  const form = useForm({
    initialValues: {
      name: '',
      areaType: 'SocialRoom',
      capacity: 1,
      requiresDeposit: false,
      depositAmount: null as number | null,
      rulesNotes: '',
      minDurationMinutes: null as number | null,
      maxDurationMinutes: null as number | null,
      isActive: true,
    },
    validate: {
      name: (v) => (v.trim().length < 1 ? 'Obligatorio' : null),
      areaType: (v) => (!v ? 'Obligatorio' : null),
      capacity: (v) => (v < 1 ? 'Debe ser al menos 1' : null),
    },
  })

  const openCreate = () => {
    form.setValues({
      name: '',
      areaType: 'SocialRoom',
      capacity: 1,
      requiresDeposit: false,
      depositAmount: null,
      rulesNotes: '',
      minDurationMinutes: null,
      maxDurationMinutes: null,
      isActive: true,
    })
    setDrawer('create')
  }

  const openEdit = (item: CommonArea) => {
    form.setValues({
      name: item.name,
      areaType: asEnumName(item.areaType, COMMON_AREA_TYPE_OPTIONS) || 'SocialRoom',
      capacity: item.capacity,
      requiresDeposit: item.requiresDeposit,
      depositAmount: item.depositAmount,
      rulesNotes: item.rulesNotes ?? '',
      minDurationMinutes: item.minDurationMinutes,
      maxDurationMinutes: item.maxDurationMinutes,
      isActive: item.isActive,
    })
    setDrawer(item)
  }

  const saveMutation = useMutation({
    mutationFn: async () => {
      const payload = {
        horizontalPropertyId: propertyId,
        name: form.values.name.trim(),
        areaType: enumIndex(form.values.areaType, COMMON_AREA_TYPE_OPTIONS),
        capacity: Number(form.values.capacity) || 1,
        requiresDeposit: form.values.requiresDeposit,
        depositAmount: form.values.requiresDeposit
          ? form.values.depositAmount === null || form.values.depositAmount === undefined
            ? null
            : Number(form.values.depositAmount)
          : null,
        rulesNotes: form.values.rulesNotes.trim() || null,
        minDurationMinutes:
          form.values.minDurationMinutes === null || form.values.minDurationMinutes === undefined
            ? null
            : Number(form.values.minDurationMinutes),
        maxDurationMinutes:
          form.values.maxDurationMinutes === null || form.values.maxDurationMinutes === undefined
            ? null
            : Number(form.values.maxDurationMinutes),
      }
      if (drawer === 'create') {
        const { data } = await api.post<CommonArea>('/api/CommonAreas', payload)
        return data
      }
      const { data } = await api.put<CommonArea>(`/api/CommonAreas/${drawer!.id}`, {
        ...payload,
        isActive: form.values.isActive,
      })
      return data
    },
    onSuccess: () => {
      notifications.show({ title: 'Guardado', message: 'Zona común guardada', color: 'teal' })
      setDrawer(null)
      invalidate()
    },
    onError: (err) =>
      notifications.show({ title: 'Error', message: getApiErrorMessage(err), color: 'red' }),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/api/CommonAreas/${id}`),
    onSuccess: () => {
      notifications.show({ title: 'Desactivado', message: 'Zona común desactivada', color: 'gray' })
      invalidate()
    },
    onError: (err) =>
      notifications.show({ title: 'Error', message: getApiErrorMessage(err), color: 'red' }),
  })

  const columns = useMemo((): ColumnDef<CommonArea>[] => {
    return [
      {
        key: 'name',
        header: 'Nombre',
        sortKey: 'name',
        filter: 'text',
        filterKey: 'name',
        render: (row) => (
          <Text size="sm" fw={500}>
            {row.name}
          </Text>
        ),
      },
      {
        key: 'areaType',
        header: 'Tipo',
        sortKey: 'areatype',
        filter: 'select',
        filterKey: 'areaType',
        filterOptions: COMMON_AREA_TYPE_OPTIONS.map((o) => ({ value: o.value, label: o.label })),
        render: (row) => labelForOption(COMMON_AREA_TYPE_OPTIONS, row.areaType),
      },
      {
        key: 'capacity',
        header: 'Capacidad',
        sortKey: 'capacity',
        filter: 'none',
        render: (row) => row.capacity,
      },
      {
        key: 'deposit',
        header: 'Depósito',
        filter: 'none',
        render: (row) =>
          row.requiresDeposit
            ? row.depositAmount != null
              ? formatMoney(row.depositAmount)
              : 'Obligatorio'
            : '—',
      },
      activeColumn<CommonArea>(),
      {
        key: 'actions',
        header: '',
        filter: 'none',
        width: 88,
        render: (row) => (
          <Group gap={4} wrap="nowrap">
            <ActionIcon variant="light" size="md" onClick={() => openEdit(row)} aria-label="Editar">
              ✎
            </ActionIcon>
            <ActionIcon
              variant="light"
              color="red"
              size="md"
              onClick={() => {
                if (window.confirm(`¿Desactivar "${row.name}"?`)) deleteMutation.mutate(row.id)
              }}
              aria-label="Eliminar"
            >
              ✕
            </ActionIcon>
          </Group>
        ),
      },
    ]
  }, [deleteMutation])

  return (
    <Stack gap="md">
      <PageHeader
        title="Zonas"
        description="Amenidades disponibles para reserva: salón social, BBQ, piscina, gimnasio y más."
      />
      <ListToolbar
        onAdd={openCreate}
        addLabel="Agregar zona"
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
            title={item.name}
            subtitle={labelForOption(COMMON_AREA_TYPE_OPTIONS, item.areaType)}
            inactive={!item.isActive}
            onEdit={() => openEdit(item)}
            onDelete={() => {
              if (window.confirm(`¿Desactivar "${item.name}"?`)) deleteMutation.mutate(item.id)
            }}
          />
        )}
      />

      <FormDrawer
        opened={drawer !== null}
        onClose={() => setDrawer(null)}
        title={drawer === 'create' ? 'Nueva zona común' : 'Editar zona común'}
      >
        <form onSubmit={form.onSubmit(() => saveMutation.mutate())}>
          <Stack gap="sm">
            <TextInput label="Nombre" required {...form.getInputProps('name')} />
            <Select
              label="Tipo de zona"
              required
              data={[...COMMON_AREA_TYPE_OPTIONS]}
              comboboxProps={formDrawerSelectComboboxProps}
              {...form.getInputProps('areaType')}
            />
            <NumberInput label="Capacidad" required min={1} {...form.getInputProps('capacity')} />
            <Switch
              label="Requiere depósito"
              {...form.getInputProps('requiresDeposit', { type: 'checkbox' })}
            />
            {form.values.requiresDeposit ? (
              <MoneyInput
                label="Valor del depósito"
                precision={2}
                {...form.getInputProps('depositAmount')}
              />
            ) : null}
            <NumberInput
              label="Duración mínima (minutos)"
              min={0}
              allowDecimal={false}
              {...form.getInputProps('minDurationMinutes')}
            />
            <NumberInput
              label="Duración máxima (minutos)"
              min={0}
              allowDecimal={false}
              {...form.getInputProps('maxDurationMinutes')}
            />
            <Textarea label="Reglas / notas" minRows={2} {...form.getInputProps('rulesNotes')} />
            {drawer !== 'create' ? (
              <Switch label="Activo" {...form.getInputProps('isActive', { type: 'checkbox' })} />
            ) : null}
            <Button type="submit" fullWidth loading={saveMutation.isPending}>
              Guardar
            </Button>
          </Stack>
        </form>
      </FormDrawer>
    </Stack>
  )
}
