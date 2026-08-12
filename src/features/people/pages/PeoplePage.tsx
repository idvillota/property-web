import {
  ActionIcon,
  Button,
  Group,
  Select,
  Stack,
  Switch,
  Text,
  TextInput,
} from '@mantine/core'
import { useForm } from '@mantine/form'
import { notifications } from '@mantine/notifications'
import { IconEye } from '@tabler/icons-react'
import { useMutation } from '@tanstack/react-query'
import { useMemo, useState } from 'react'
import { api } from '../../../api/client'
import { getApiErrorMessage } from '../../../api/errors'
import type { Person } from '../../../api/types'
import { EntityCard } from '../../../components/crud/EntityCard'
import { FormDrawer } from '../../../components/crud/FormDrawer'
import { ListToolbar } from '../../../components/crud/ListToolbar'
import { PagedEntityView } from '../../../components/data-table/PagedEntityView'
import { activeColumn } from '../../../components/data-table/tableColumns'
import type { ColumnDef } from '../../../components/data-table/types'
import { PageHeader } from '../../../components/shared/PageHeader'
import { useInvalidate } from '../../../hooks/useInvalidate'
import { usePagedListQuery } from '../../../hooks/usePagedListQuery'
import { usePagedListState } from '../../../hooks/usePagedListState'
import { formDrawerSelectComboboxProps } from '../../../lib/formDrawerSelect'
import { DOCUMENT_TYPE_OPTIONS, labelForOption } from '../../../lib/structureEnums'
import { PersonOverviewDrawer } from '../components/PersonOverviewDrawer'

export function PeoplePage() {
  const [drawer, setDrawer] = useState<'create' | Person | null>(null)
  const [overviewPersonId, setOverviewPersonId] = useState<string | null>(null)
  const invalidate = useInvalidate(['people', 'people-options'])
  const list = usePagedListState('lastname')
  const listQuery = usePagedListQuery<Person>('people', '/api/People', list)

  const form = useForm({
    initialValues: {
      documentType: 'CC',
      documentNumber: '',
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      isActive: true,
    },
    validate: {
      documentType: (v) => (!v ? 'Obligatorio' : null),
      documentNumber: (v) => (v.trim().length < 1 ? 'Obligatorio' : null),
      firstName: (v) => (v.trim().length < 1 ? 'Obligatorio' : null),
      lastName: (v) => (v.trim().length < 1 ? 'Obligatorio' : null),
    },
  })

  const openCreate = () => {
    form.setValues({
      documentType: 'CC',
      documentNumber: '',
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      isActive: true,
    })
    setDrawer('create')
  }

  const openEdit = (item: Person) => {
    form.setValues({
      documentType: item.documentType,
      documentNumber: item.documentNumber,
      firstName: item.firstName,
      lastName: item.lastName,
      email: item.email ?? '',
      phone: item.phone ?? '',
      isActive: item.isActive,
    })
    setDrawer(item)
  }

  const saveMutation = useMutation({
    mutationFn: async () => {
      const payload = {
        documentType: form.values.documentType,
        documentNumber: form.values.documentNumber.trim(),
        firstName: form.values.firstName.trim(),
        lastName: form.values.lastName.trim(),
        email: form.values.email.trim() || null,
        phone: form.values.phone.trim() || null,
      }
      if (drawer === 'create') {
        const { data } = await api.post<Person>('/api/People', payload)
        return data
      }
      const { data } = await api.put<Person>(`/api/People/${drawer!.id}`, {
        ...payload,
        isActive: form.values.isActive,
      })
      return data
    },
    onSuccess: () => {
      notifications.show({ title: 'Guardado', message: 'Persona guardada', color: 'teal' })
      setDrawer(null)
      invalidate()
    },
    onError: (err) =>
      notifications.show({ title: 'Error', message: getApiErrorMessage(err), color: 'red' }),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/api/People/${id}`),
    onSuccess: () => {
      notifications.show({ title: 'Desactivado', message: 'Persona desactivada', color: 'gray' })
      invalidate()
    },
    onError: (err) =>
      notifications.show({ title: 'Error', message: getApiErrorMessage(err), color: 'red' }),
  })

  const columns = useMemo((): ColumnDef<Person>[] => {
    return [
      {
        key: 'name',
        header: 'Nombre',
        sortKey: 'lastname',
        filter: 'text',
        filterKey: 'lastName',
        render: (row) => (
          <Text
            size="sm"
            fw={500}
            style={{ cursor: 'pointer' }}
            c="teal"
            onClick={() => setOverviewPersonId(row.id)}
          >
            {row.firstName} {row.lastName}
          </Text>
        ),
      },
      {
        key: 'document',
        header: 'Documento',
        sortKey: 'documentnumber',
        filter: 'text',
        filterKey: 'documentNumber',
        render: (row) =>
          `${labelForOption(DOCUMENT_TYPE_OPTIONS, row.documentType)} ${row.documentNumber}`,
      },
      {
        key: 'email',
        header: 'Correo',
        sortKey: 'email',
        filter: 'text',
        filterKey: 'email',
        render: (row) => row.email ?? '—',
      },
      {
        key: 'phone',
        header: 'Teléfono',
        filter: 'text',
        filterKey: 'phone',
        render: (row) => row.phone ?? '—',
      },
      activeColumn<Person>(),
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
              onClick={() => setOverviewPersonId(row.id)}
              aria-label="Ver resumen"
            >
              <IconEye size={16} stroke={1.75} />
            </ActionIcon>
            <ActionIcon variant="light" size="md" onClick={() => openEdit(row)} aria-label="Editar">
              ✎
            </ActionIcon>
            <ActionIcon
              variant="light"
              color="red"
              size="md"
              onClick={() => {
                if (window.confirm(`¿Desactivar "${row.firstName} ${row.lastName}"?`))
                  deleteMutation.mutate(row.id)
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
        title="Directorio de personas"
        description="Toca un nombre para ver unidades, estado de pagos y reservas."
      />
      <ListToolbar
        onAdd={openCreate}
        addLabel="Agregar persona"
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
            title={`${item.firstName} ${item.lastName}`}
            subtitle={`${labelForOption(DOCUMENT_TYPE_OPTIONS, item.documentType)} ${item.documentNumber}`}
            inactive={!item.isActive}
            meta={
              <Button size="compact-xs" variant="subtle" onClick={() => setOverviewPersonId(item.id)}>
                Ver resumen
              </Button>
            }
            onEdit={() => openEdit(item)}
            onDelete={() => {
              if (window.confirm(`¿Desactivar "${item.firstName} ${item.lastName}"?`))
                deleteMutation.mutate(item.id)
            }}
          />
        )}
      />

      <PersonOverviewDrawer
        personId={overviewPersonId}
        onClose={() => setOverviewPersonId(null)}
      />

      <FormDrawer
        opened={drawer !== null}
        onClose={() => setDrawer(null)}
        title={drawer === 'create' ? 'Nueva persona' : 'Editar persona'}
      >
        <form onSubmit={form.onSubmit(() => saveMutation.mutate())}>
          <Stack gap="sm">
            <Select
              label="Tipo de documento"
              required
              data={[...DOCUMENT_TYPE_OPTIONS]}
              comboboxProps={formDrawerSelectComboboxProps}
              {...form.getInputProps('documentType')}
            />
            <TextInput label="Número de documento" required {...form.getInputProps('documentNumber')} />
            <TextInput label="Nombres" required {...form.getInputProps('firstName')} />
            <TextInput label="Apellidos" required {...form.getInputProps('lastName')} />
            <TextInput label="Correo" type="email" {...form.getInputProps('email')} />
            <TextInput label="Teléfono" {...form.getInputProps('phone')} />
            {drawer !== 'create' && (
              <Switch label="Activo" {...form.getInputProps('isActive', { type: 'checkbox' })} />
            )}
            <Button type="submit" fullWidth loading={saveMutation.isPending}>
              Guardar
            </Button>
          </Stack>
        </form>
      </FormDrawer>
    </Stack>
  )
}
