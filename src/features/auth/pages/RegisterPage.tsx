import { Anchor, Button, Paper, PasswordInput, Stack, Text, TextInput, Title } from '@mantine/core'
import { useForm } from '@mantine/form'
import { notifications } from '@mantine/notifications'
import { Link, useNavigate } from 'react-router-dom'
import { api } from '../../../api/client'
import type { AuthResponse } from '../../../api/types'
import { AppLogo } from '../../../components/shared/AppLogo'
import { ColorSchemeToggle } from '../../../components/shared/ColorSchemeToggle'
import { applyAuthSession } from '../applyAuthSession'

export function RegisterPage() {
  const navigate = useNavigate()

  const form = useForm({
    initialValues: {
      tenantName: '',
      adminEmail: '',
      password: '',
      adminDisplayName: '',
    },
    validate: {
      tenantName: (v) => (v.trim().length < 2 ? 'Ingresa un nombre de tenant' : null),
      adminEmail: (v) => (/^\S+@\S+$/.test(v) ? null : 'Inválido'),
      password: (v) => (v.length < 8 ? 'Mínimo 8 caracteres' : null),
    },
  })

  const submit = form.onSubmit(async (values) => {
    try {
      const { data } = await api.post<AuthResponse>('/api/Auth/register', {
        tenantName: values.tenantName,
        adminEmail: values.adminEmail,
        password: values.password,
        adminDisplayName: values.adminDisplayName || undefined,
      })
      applyAuthSession(data)
      notifications.show({ title: 'Tenant listo', message: data.tenantSlug, color: 'teal' })
      navigate('/dashboard')
    } catch (err: unknown) {
      const msg =
        typeof err === 'object' && err !== null && 'response' in err
          ? String((err as { response?: { data?: { message?: string } } }).response?.data?.message ?? 'No se pudo registrar')
          : 'No se pudo registrar'
      notifications.show({ title: 'Registro fallido', message: msg, color: 'red' })
    }
  })

  return (
    <Stack align="center" justify="center" mih="100vh" className="auth-page" p="md" pos="relative">
      <div style={{ position: 'absolute', top: 16, right: 16 }}>
        <ColorSchemeToggle />
      </div>

      <Stack align="center" gap="lg" w="100%" maw={440}>
        <AppLogo variant="auth" to={null} />

        <Paper radius="md" p="xl" withBorder w="100%" shadow="md">
          <Title order={2} mb="xs" ta="center">
            Crear tenant
          </Title>
          <Text c="dimmed" size="sm" mb="lg" ta="center">
            Registra tu tenant, administrador y roles por defecto
          </Text>
          <form onSubmit={submit}>
            <Stack gap="sm">
              <TextInput label="Nombre del tenant" {...form.getInputProps('tenantName')} />
              <TextInput label="Correo del administrador" {...form.getInputProps('adminEmail')} />
              <TextInput label="Nombre para mostrar (opcional)" {...form.getInputProps('adminDisplayName')} />
              <PasswordInput label="Contraseña" {...form.getInputProps('password')} />
              <Button type="submit" fullWidth mt="sm">
                Registrar e iniciar sesión
              </Button>
            </Stack>
          </form>
          <Text size="sm" mt="md" ta="center">
            ¿Ya tienes acceso?{' '}
            <Anchor component={Link} to="/login" size="sm">
              Iniciar sesión
            </Anchor>
          </Text>
        </Paper>
      </Stack>
    </Stack>
  )
}
