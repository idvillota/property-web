import {
  Alert,
  Badge,
  Button,
  Group,
  Loader,
  Paper,
  PasswordInput,
  Select,
  Stack,
  Table,
  Text,
  TextInput,
} from '@mantine/core'
import { useForm } from '@mantine/form'
import { notifications } from '@mantine/notifications'
import { useMutation, useQuery } from '@tanstack/react-query'
import { api } from '../../../api/client'
import { getApiErrorMessage } from '../../../api/errors'
import type { InvitedTenantUser, TenantUserListItem } from '../../../api/types'
import { PageHeader } from '../../../components/shared/PageHeader'
import { useInvalidate } from '../../../hooks/useInvalidate'
import { TEAM_ROLES } from '../../../lib/enums'
import { formDrawerSelectComboboxProps } from '../../../lib/formDrawerSelect'

const ROLE_LABELS: Record<string, string> = {
  Administrator: 'Administrador',
  Manager: 'Gerente',
  Accountant: 'Contador',
  Receptionist: 'Portería',
  Owner: 'Propietario',
  Resident: 'Residente',
}

function roleLabel(role: string) {
  return ROLE_LABELS[role] ?? role
}

export function TeamInvitePage() {
  const invalidate = useInvalidate(['tenant-users'])

  const listQuery = useQuery({
    queryKey: ['tenant-users'],
    queryFn: async () => {
      const { data } = await api.get<TenantUserListItem[]>('/api/TenantUsers')
      return data
    },
  })

  const form = useForm({
    initialValues: {
      email: '',
      password: '',
      displayName: '',
      role: 'Manager',
    },
    validate: {
      email: (v) => (/^\S+@\S+$/.test(v) ? null : 'Inválido'),
      role: (v) => (v ? null : 'Obligatorio'),
    },
  })

  const inviteMutation = useMutation({
    mutationFn: async () => {
      const { data } = await api.post<InvitedTenantUser>('/api/TenantUsers/invite', {
        email: form.values.email.trim(),
        password: form.values.password || undefined,
        displayName: form.values.displayName.trim() || undefined,
        role: form.values.role,
      })
      return data
    },
    onSuccess: (data) => {
      notifications.show({
        title: 'Usuario invitado',
        message: `${data.email} — ID tenant user: ${data.tenantUserId}`,
        color: 'teal',
      })
      form.reset()
      invalidate()
    },
    onError: (err) =>
      notifications.show({ title: 'Invitación fallida', message: getApiErrorMessage(err), color: 'red' }),
  })

  return (
    <Stack gap="lg" maw={900}>
      <PageHeader
        title="Equipo"
        description="Usuarios con acceso a este tenant. Invite gerentes o contadores; use el ID de usuario del tenant al vincular un empleado."
      />

      <Paper withBorder p="md" radius="md">
        <Text fw={600} mb="sm">
          Usuarios del tenant
        </Text>
        {listQuery.isLoading ? (
          <Loader size="sm" />
        ) : listQuery.isError ? (
          <Alert color="red">{getApiErrorMessage(listQuery.error)}</Alert>
        ) : (listQuery.data?.length ?? 0) === 0 ? (
          <Alert color="gray">Aún no hay miembros listados.</Alert>
        ) : (
          <Table striped highlightOnHover>
            <Table.Thead>
              <Table.Tr>
                <Table.Th>Correo</Table.Th>
                <Table.Th>Nombre</Table.Th>
                <Table.Th>Roles</Table.Th>
                <Table.Th>Estado</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {listQuery.data!.map((row) => (
                <Table.Tr key={row.tenantUserId}>
                  <Table.Td>{row.email}</Table.Td>
                  <Table.Td>{row.displayName || '—'}</Table.Td>
                  <Table.Td>
                    <Group gap={4}>
                      {row.roles.map((r) => (
                        <Badge key={r} size="sm" variant="light">
                          {roleLabel(r)}
                        </Badge>
                      ))}
                    </Group>
                  </Table.Td>
                  <Table.Td>{row.isActive ? 'Activo' : 'Inactivo'}</Table.Td>
                </Table.Tr>
              ))}
            </Table.Tbody>
          </Table>
        )}
      </Paper>

      <Paper withBorder p="md" radius="md" maw={480}>
        <Text fw={600} mb="sm">
          Invitar usuario
        </Text>
        <form onSubmit={form.onSubmit(() => inviteMutation.mutate())}>
          <Stack gap="sm">
            <TextInput label="Correo" type="email" required {...form.getInputProps('email')} />
            <PasswordInput
              label="Contraseña"
              description="Obligatoria para correos nuevos; déjala vacía si el usuario ya existe"
              {...form.getInputProps('password')}
            />
            <TextInput label="Nombre para mostrar" {...form.getInputProps('displayName')} />
            <Select
              label="Rol"
              data={[...TEAM_ROLES]}
              required
              comboboxProps={formDrawerSelectComboboxProps}
              {...form.getInputProps('role')}
            />
            <Button type="submit" fullWidth loading={inviteMutation.isPending} mt="sm">
              Enviar invitación
            </Button>
          </Stack>
        </form>
      </Paper>
    </Stack>
  )
}
