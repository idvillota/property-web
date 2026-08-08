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

export function PeoplePage() {
  const [drawer, setDrawer] = useState<'create' | Person | null>(null)
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
      documentType: (v) => (!v ? 'Required' : null),
      documentNumber: (v) => (v.trim().length < 1 ? 'Required' : null),
      firstName: (v) => (v.trim().length < 1 ? 'Required' : null),
      lastName: (v) => (v.trim().length < 1 ? 'Required' : null),
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
      notifications.show({ title: 'Saved', message: 'Person saved', color: 'teal' })
      setDrawer(null)
      invalidate()
    },
    onError: (err) =>
      notifications.show({ title: 'Error', message: getApiErrorMessage(err), color: 'red' }),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/api/People/${id}`),
    onSuccess: () => {
      notifications.show({ title: 'Deactivated', message: 'Person deactivated', color: 'gray' })
      invalidate()
    },
    onError: (err) =>
      notifications.show({ title: 'Error', message: getApiErrorMessage(err), color: 'red' }),
  })

  const columns = useMemo((): ColumnDef<Person>[] => {
    return [
      {
        key: 'name',
        header: 'Name',
        sortKey: 'lastname',
        filter: 'text',
        filterKey: 'lastName',
        render: (row) => (
          <Text size="sm" fw={500}>
            {row.firstName} {row.lastName}
          </Text>
        ),
      },
      {
        key: 'document',
        header: 'Document',
        sortKey: 'documentnumber',
        filter: 'text',
        filterKey: 'documentNumber',
        render: (row) =>
          `${labelForOption(DOCUMENT_TYPE_OPTIONS, row.documentType)} ${row.documentNumber}`,
      },
      {
        key: 'email',
        header: 'Email',
        sortKey: 'email',
        filter: 'text',
        filterKey: 'email',
        render: (row) => row.email ?? '—',
      },
      {
        key: 'phone',
        header: 'Phone',
        filter: 'text',
        filterKey: 'phone',
        render: (row) => row.phone ?? '—',
      },
      activeColumn<Person>(),
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
                if (window.confirm(`Deactivate "${row.firstName} ${row.lastName}"?`))
                  deleteMutation.mutate(row.id)
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

  return (
    <Stack gap="md">
      <PageHeader
        title="People"
        description="Owners, tenants, and contacts used across unit occupancies."
      />
      <ListToolbar
        onAdd={openCreate}
        addLabel="Add person"
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
            onEdit={() => openEdit(item)}
            onDelete={() => {
              if (window.confirm(`Deactivate "${item.firstName} ${item.lastName}"?`))
                deleteMutation.mutate(item.id)
            }}
          />
        )}
      />

      <FormDrawer
        opened={drawer !== null}
        onClose={() => setDrawer(null)}
        title={drawer === 'create' ? 'New person' : 'Edit person'}
      >
        <form onSubmit={form.onSubmit(() => saveMutation.mutate())}>
          <Stack gap="sm">
            <Select
              label="Document type"
              required
              data={[...DOCUMENT_TYPE_OPTIONS]}
              comboboxProps={formDrawerSelectComboboxProps}
              {...form.getInputProps('documentType')}
            />
            <TextInput label="Document number" required {...form.getInputProps('documentNumber')} />
            <TextInput label="First name" required {...form.getInputProps('firstName')} />
            <TextInput label="Last name" required {...form.getInputProps('lastName')} />
            <TextInput label="Email" type="email" {...form.getInputProps('email')} />
            <TextInput label="Phone" {...form.getInputProps('phone')} />
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
