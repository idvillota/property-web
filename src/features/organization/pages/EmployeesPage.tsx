import { ActionIcon, Button, Group, Stack, Switch, Text, TextInput } from '@mantine/core'
import { useForm } from '@mantine/form'
import { notifications } from '@mantine/notifications'
import { useMutation } from '@tanstack/react-query'
import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../../../api/client'
import { getApiErrorMessage } from '../../../api/errors'
import type { Employee } from '../../../api/types'
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

export function EmployeesPage() {
  const [drawer, setDrawer] = useState<'create' | Employee | null>(null)
  const invalidate = useInvalidate(['employees'])
  const list = usePagedListState('fullname')
  const listQuery = usePagedListQuery<Employee>('employees', '/api/Employees', list)

  const form = useForm({
    initialValues: {
      fullName: '',
      jobTitle: '',
      hiredOn: '',
      tenantUserId: '',
      isActive: true,
    },
    validate: { fullName: (v) => (v.trim().length < 1 ? 'Obligatorio' : null) },
  })

  const openCreate = () => {
    form.setValues({ fullName: '', jobTitle: '', hiredOn: '', tenantUserId: '', isActive: true })
    setDrawer('create')
  }

  const openEdit = (item: Employee) => {
    form.setValues({
      fullName: item.fullName,
      jobTitle: item.jobTitle ?? '',
      hiredOn: item.hiredOn ?? '',
      tenantUserId: item.tenantUserId ?? '',
      isActive: item.isActive,
    })
    setDrawer(item)
  }

  const saveMutation = useMutation({
    mutationFn: async () => {
      const payload = {
        fullName: form.values.fullName.trim(),
        jobTitle: form.values.jobTitle.trim() || null,
        hiredOn: form.values.hiredOn || null,
        tenantUserId: form.values.tenantUserId.trim() || null,
      }
      if (drawer === 'create') {
        const { data } = await api.post<Employee>('/api/Employees', payload)
        return data
      }
      const { data } = await api.put<Employee>(`/api/Employees/${drawer!.id}`, {
        ...payload,
        isActive: form.values.isActive,
      })
      return data
    },
    onSuccess: () => {
      notifications.show({ title: 'Guardado', message: 'Cambios guardados', color: 'teal' })
      setDrawer(null)
      invalidate()
    },
    onError: (err) =>
      notifications.show({ title: 'Error', message: getApiErrorMessage(err), color: 'red' }),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/api/Employees/${id}`),
    onSuccess: () => {
      notifications.show({ title: 'Eliminado', message: 'Elemento desactivado', color: 'gray' })
      invalidate()
    },
    onError: (err) =>
      notifications.show({ title: 'Error', message: getApiErrorMessage(err), color: 'red' }),
  })

  const columns = useMemo((): ColumnDef<Employee>[] => {
    return [
      {
        key: 'fullName',
        header: 'Nombre',
        sortKey: 'fullname',
        filter: 'text',
        filterKey: 'fullName',
        render: (row) => (
          <Text size="sm" fw={500}>
            {row.fullName}
          </Text>
        ),
      },
      {
        key: 'jobTitle',
        header: 'Cargo',
        sortKey: 'jobtitle',
        filter: 'text',
        filterKey: 'jobTitle',
        render: (row) => row.jobTitle ?? '—',
      },
      activeColumn<Employee>(),
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
                if (window.confirm(`¿Desactivar "${row.fullName}"?`)) deleteMutation.mutate(row.id)
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
        title="Empleados"
        description={
          <>
            Registros de personal. Vincula el acceso desde{' '}
            <Text component={Link} to="/team" size="sm" c="teal" span>
              Invitar equipo
            </Text>
            .
          </>
        }
      />
      <ListToolbar
        onAdd={openCreate}
        addLabel="Agregar empleado"
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
            title={item.fullName}
            subtitle={item.jobTitle ?? undefined}
            inactive={!item.isActive}
            meta={
              item.tenantUserId ? (
                <Text size="xs" c="dimmed">
                  Usuario vinculado
                </Text>
              ) : null
            }
            onEdit={() => openEdit(item)}
            onDelete={() => {
              if (window.confirm(`¿Desactivar "${item.fullName}"?`)) deleteMutation.mutate(item.id)
            }}
          />
        )}
      />

      <FormDrawer
        opened={drawer !== null}
        onClose={() => setDrawer(null)}
        title={drawer === 'create' ? 'Nuevo empleado' : 'Editar empleado'}
      >
        <form onSubmit={form.onSubmit(() => saveMutation.mutate())}>
          <Stack gap="sm">
            <TextInput label="Nombre completo" required {...form.getInputProps('fullName')} />
            <TextInput label="Cargo" {...form.getInputProps('jobTitle')} />
            <TextInput label="Fecha de contratación" type="date" {...form.getInputProps('hiredOn')} />
            <TextInput
              label="ID de usuario del tenant"
              description="Desde Invitación al equipo (opcional)"
              {...form.getInputProps('tenantUserId')}
            />
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
