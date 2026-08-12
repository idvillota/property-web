import { Button, Paper, PasswordInput, Select, Stack, Text, TextInput } from '@mantine/core'
import { useForm } from '@mantine/form'
import { notifications } from '@mantine/notifications'
import { useMutation } from '@tanstack/react-query'
import { api } from '../../../api/client'
import { getApiErrorMessage } from '../../../api/errors'
import type { InvitedTenantUser } from '../../../api/types'
import { PageHeader } from '../../../components/shared/PageHeader'
import { TEAM_ROLES } from '../../../lib/enums'

export function TeamInvitePage() {
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
        message: `ID de usuario del tenant: ${data.tenantUserId}`,
        color: 'teal',
      })
      form.reset()
    },
    onError: (err) =>
      notifications.show({ title: 'Invitación fallida', message: getApiErrorMessage(err), color: 'red' }),
  })

  return (
    <Stack gap="md" maw={480}>
      <PageHeader
        title="Equipo"
        description="Otorga acceso a este tenant. Usa el ID de usuario del tenant al vincular un empleado."
      />
      <Paper withBorder p="md" radius="md">
        <form onSubmit={form.onSubmit(() => inviteMutation.mutate())}>
          <Stack gap="sm">
            <TextInput label="Correo" type="email" required {...form.getInputProps('email')} />
            <PasswordInput
              label="Contraseña"
              description="Obligatoria para correos nuevos; déjala vacía si el usuario ya existe"
              {...form.getInputProps('password')}
            />
            <TextInput label="Nombre para mostrar" {...form.getInputProps('displayName')} />
            <Select label="Rol" data={[...TEAM_ROLES]} required {...form.getInputProps('role')} />
            <Button type="submit" fullWidth loading={inviteMutation.isPending} mt="sm">
              Enviar invitación
            </Button>
          </Stack>
        </form>
      </Paper>
      <Text size="xs" c="dimmed">
        Administradores y gerentes pueden invitar usuarios. El rol de invitación es Gerente.
      </Text>
    </Stack>
  )
}
