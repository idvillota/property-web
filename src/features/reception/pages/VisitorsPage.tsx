import { Alert, Button, Card, Group, Select, Stack, Switch, Text, Textarea, TextInput } from '@mantine/core'
import { useForm } from '@mantine/form'
import { notifications } from '@mantine/notifications'
import { useMutation } from '@tanstack/react-query'
import { useEffect, useMemo } from 'react'
import { api } from '../../../api/client'
import { getApiErrorMessage } from '../../../api/errors'
import type { Unit, VisitLog } from '../../../api/types'
import { PagedEntityView } from '../../../components/data-table/PagedEntityView'
import type { ColumnDef } from '../../../components/data-table/types'
import { PageHeader } from '../../../components/shared/PageHeader'
import { useBuildingById } from '../../../hooks/useBuildingById'
import { useEntityOptions } from '../../../hooks/useEntityOptions'
import { useInvalidate } from '../../../hooks/useInvalidate'
import { usePagedListQuery } from '../../../hooks/usePagedListQuery'
import { usePagedListState } from '../../../hooks/usePagedListState'
import { usePropertyId } from '../../../hooks/usePropertyId'
import { formDrawerSelectComboboxProps } from '../../../lib/formDrawerSelect'
import { DOCUMENT_TYPE_OPTIONS, labelForOption } from '../../../lib/structureEnums'
import { toDwellingUnitSelectOptions } from '../../../lib/unitLabels'
import { visitRegisterFormValidatesRequired } from '../lib/visitRegisterValidation'

function formatEnteredAt(iso: string) {
  try {
    return new Date(iso).toLocaleString('es-CO', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  } catch {
    return iso
  }
}

export function VisitorsPage() {
  const propertyId = usePropertyId()
  const invalidate = useInvalidate(['visit-logs'])
  const list = usePagedListState('enteredatutc', {
    sortDir: 'desc',
    columnFilters: { horizontalPropertyId: propertyId },
  })
  const listQuery = usePagedListQuery<VisitLog>('visit-logs', '/api/visit-logs', list)

  useEffect(() => {
    list.setFilter('horizontalPropertyId', propertyId)
  }, [propertyId, list.setFilter])

  const units = useEntityOptions<Unit>('visit-unit-options', '/api/Units', {
    horizontalPropertyId: propertyId,
  })
  const { buildingById } = useBuildingById(propertyId)
  const unitOptions = useMemo(
    () => toDwellingUnitSelectOptions(units.data ?? [], buildingById),
    [units.data, buildingById],
  )

  const form = useForm({
    initialValues: {
      documentType: 'CC',
      documentNumber: '',
      firstName: '',
      lastName: '',
      unitId: '',
      notes: '',
      requiresApproval: true,
    },
    validate: {
      documentType: (v) => (!v ? 'Obligatorio' : null),
      documentNumber: (v) => (!v?.trim() ? 'Obligatorio' : null),
      firstName: (v) => (!v?.trim() ? 'Obligatorio' : null),
      unitId: (v) => (!v ? 'Obligatorio' : null),
    },
  })

  const registerMutation = useMutation({
    mutationFn: async () => {
      const values = form.values
      if (
        !visitRegisterFormValidatesRequired({
          documentType: values.documentType,
          documentNumber: values.documentNumber,
          firstName: values.firstName,
          lastName: values.lastName,
          unitId: values.unitId,
        })
      ) {
        throw new Error('Completa los campos obligatorios.')
      }
      const { data } = await api.post<VisitLog>('/api/visit-logs', {
        horizontalPropertyId: propertyId,
        unitId: values.unitId,
        documentType: values.documentType,
        documentNumber: values.documentNumber.trim(),
        firstName: values.firstName.trim(),
        lastName: values.lastName.trim() || null,
        notes: values.notes.trim() || null,
        requiresApproval: values.requiresApproval,
      })
      return data
    },
    onSuccess: (data) => {
      notifications.show({
        title: 'Visita registrada',
        message: data.visitorWasReused
          ? `${data.visitorFullName} (visitante reutilizado) → ${data.unitCode}`
          : `${data.visitorFullName} → ${data.unitCode}`,
        color: 'teal',
      })
      form.reset()
      invalidate()
    },
    onError: (err) =>
      notifications.show({ title: 'Error', message: getApiErrorMessage(err), color: 'red' }),
  })

  const columns = useMemo<ColumnDef<VisitLog>[]>(
    () => [
      {
        key: 'enteredAtUtc',
        header: 'Ingreso',
        sortKey: 'enteredatutc',
        render: (row) => formatEnteredAt(row.enteredAtUtc),
      },
      {
        key: 'visitor',
        header: 'Visitante',
        render: (row) => row.visitorFullName,
      },
      {
        key: 'document',
        header: 'Documento',
        render: (row) =>
          `${labelForOption(DOCUMENT_TYPE_OPTIONS, row.documentType)} ${row.documentNumber}`,
      },
      {
        key: 'unitCode',
        header: 'Unidad',
        render: (row) => row.unitCode,
      },
      {
        key: 'notes',
        header: 'Notas',
        render: (row) => row.notes?.trim() || '—',
      },
    ],
    [],
  )

  if (!propertyId) {
    return <Alert color="yellow">Selecciona una propiedad para registrar visitantes.</Alert>
  }

  return (
    <Stack gap="md">
      <PageHeader
        title="Visitantes"
        description="Libro de visitas: captura nombre, documento y unidad destino."
      />

      <form
        onSubmit={form.onSubmit(() => {
          if (
            !visitRegisterFormValidatesRequired({
              documentType: form.values.documentType,
              documentNumber: form.values.documentNumber,
              firstName: form.values.firstName,
              lastName: form.values.lastName,
              unitId: form.values.unitId,
            })
          ) {
            form.validate()
            return
          }
          registerMutation.mutate()
        })}
      >
        <Stack gap="sm">
          <Group grow align="flex-start">
            <Select
              label="Tipo de documento"
              required
              data={[...DOCUMENT_TYPE_OPTIONS]}
              comboboxProps={formDrawerSelectComboboxProps}
              {...form.getInputProps('documentType')}
            />
            <TextInput
              label="Número de documento"
              required
              {...form.getInputProps('documentNumber')}
            />
          </Group>
          <Group grow align="flex-start">
            <TextInput label="Nombres" required {...form.getInputProps('firstName')} />
            <TextInput label="Apellidos" {...form.getInputProps('lastName')} />
          </Group>
          <Select
            label="Unidad destino"
            required
            searchable
            data={unitOptions}
            comboboxProps={formDrawerSelectComboboxProps}
            {...form.getInputProps('unitId')}
          />
          <Textarea label="Notas" minRows={2} {...form.getInputProps('notes')} />
          <Switch
            label="Requiere autorización del habitante"
            description="El residente aprueba o rechaza desde el portal"
            {...form.getInputProps('requiresApproval', { type: 'checkbox' })}
          />
          <Button type="submit" loading={registerMutation.isPending}>
            Registrar visita
          </Button>
        </Stack>
      </form>

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
        searchPlaceholder="Buscar visitante, documento o unidad…"
        emptyMessage="Sin visitas registradas. Usa el formulario de arriba."
        renderCard={(item) => (
          <Card key={item.id} withBorder padding="md" radius="md">
            <Stack gap={4}>
              <Text fw={600} size="sm">
                {item.visitorFullName}
              </Text>
              <Text size="xs" c="dimmed">
                {labelForOption(DOCUMENT_TYPE_OPTIONS, item.documentType)} {item.documentNumber} ·{' '}
                {item.unitCode}
              </Text>
              <Text size="xs" c="dimmed">
                {formatEnteredAt(item.enteredAtUtc)}
              </Text>
            </Stack>
          </Card>
        )}
      />
    </Stack>
  )
}
