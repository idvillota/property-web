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
      tenantName: (v) => (v.trim().length < 2 ? 'Enter a tenant name' : null),
      adminEmail: (v) => (/^\S+@\S+$/.test(v) ? null : 'Invalid email'),
      password: (v) => (v.length < 8 ? 'Minimum 8 characters' : null),
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
      notifications.show({ title: 'Tenant ready', message: data.tenantSlug, color: 'teal' })
      navigate('/dashboard')
    } catch (err: unknown) {
      const msg =
        typeof err === 'object' && err !== null && 'response' in err
          ? String((err as { response?: { data?: { message?: string } } }).response?.data?.message ?? 'Could not register')
          : 'Could not register'
      notifications.show({ title: 'Registration failed', message: msg, color: 'red' })
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
            Create tenant
          </Title>
          <Text c="dimmed" size="sm" mb="lg" ta="center">
            Register your Property tenant, administrator, and default roles
          </Text>
          <form onSubmit={submit}>
            <Stack gap="sm">
              <TextInput label="Tenant name" {...form.getInputProps('tenantName')} />
              <TextInput label="Administrator email" {...form.getInputProps('adminEmail')} />
              <TextInput label="Display name (optional)" {...form.getInputProps('adminDisplayName')} />
              <PasswordInput label="Password" {...form.getInputProps('password')} />
              <Button type="submit" fullWidth mt="sm">
                Register and sign in
              </Button>
            </Stack>
          </form>
          <Text size="sm" mt="md" ta="center">
            Already have access?{' '}
            <Anchor component={Link} to="/login" size="sm">
              Sign in
            </Anchor>
          </Text>
        </Paper>
      </Stack>
    </Stack>
  )
}
