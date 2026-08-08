import { Alert, Anchor, Button, Paper, PasswordInput, Select, Stack, Text, TextInput, Title } from '@mantine/core'
import { useForm } from '@mantine/form'
import { notifications } from '@mantine/notifications'
import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { api } from '../../../api/client'
import type { AuthResponse, LoginTenantOption } from '../../../api/types'
import { AppLogo } from '../../../components/shared/AppLogo'
import { ColorSchemeToggle } from '../../../components/shared/ColorSchemeToggle'
import { applyAuthSession } from '../applyAuthSession'
import { getLoginErrorMessage, parseMultipleTenantsLoginError } from '../loginErrors'

export function LoginPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const sessionExpiredNotified = useRef(false)
  const [tenantChoices, setTenantChoices] = useState<LoginTenantOption[] | null>(null)
  const tenantChoicesRef = useRef<LoginTenantOption[] | null>(null)
  tenantChoicesRef.current = tenantChoices

  useEffect(() => {
    if (searchParams.get('session') !== 'expired' || sessionExpiredNotified.current) return
    sessionExpiredNotified.current = true
    notifications.show({
      title: 'Session expired',
      message: 'Sign in again to continue.',
      color: 'orange',
    })
  }, [searchParams])

  const form = useForm({
    initialValues: {
      email: '',
      password: '',
      tenantSlug: '',
    },
    validate: {
      email: (v) => (/^\S+@\S+$/.test(v) ? null : 'Invalid email'),
      password: (v) => (v.length < 6 ? 'Minimum 6 characters' : null),
      tenantSlug: (v) => (tenantChoicesRef.current && !v ? 'Select a tenant' : null),
    },
  })

  const completeLogin = (data: AuthResponse) => {
    applyAuthSession(data)
    notifications.show({ title: 'Welcome', message: data.tenantSlug, color: 'teal' })
    const returnUrl = searchParams.get('returnUrl')
    const destination =
      returnUrl && returnUrl.startsWith('/') && !returnUrl.startsWith('//') ? returnUrl : '/dashboard'
    navigate(destination)
  }

  const submit = form.onSubmit(async (values) => {
    try {
      const { data } = await api.post<AuthResponse>('/api/Auth/login', {
        email: values.email,
        password: values.password,
        tenantSlug: values.tenantSlug || undefined,
      })
      completeLogin(data)
    } catch (err: unknown) {
      const multiTenant = parseMultipleTenantsLoginError(err)
      if (multiTenant) {
        setTenantChoices(multiTenant.tenants)
        if (!values.tenantSlug && multiTenant.tenants.length === 1) {
          form.setFieldValue('tenantSlug', multiTenant.tenants[0].slug)
        }
        form.setFieldError('tenantSlug', 'Select a tenant')
        return
      }

      setTenantChoices(null)
      notifications.show({
        title: 'Sign-in failed',
        message: getLoginErrorMessage(err),
        color: 'red',
      })
    }
  })

  const tenantSelectData = (tenantChoices ?? []).map((t) => ({
    value: t.slug,
    label: t.name,
  }))

  return (
    <Stack align="center" justify="center" mih="100vh" className="auth-page" p="md" pos="relative">
      <div style={{ position: 'absolute', top: 16, right: 16 }}>
        <ColorSchemeToggle />
      </div>

      <Stack align="center" gap="lg" w="100%" maw={440}>
        <AppLogo variant="auth" to={null} />

        <Paper radius="md" p="xl" withBorder w="100%" shadow="md">
          <Title order={2} mb="xs" ta="center">
            Sign in
          </Title>
          <Text c="dimmed" size="sm" mb="lg" ta="center">
            Property platform for multi-tenant operations
          </Text>
          <form onSubmit={submit}>
            <Stack gap="sm">
              {tenantChoices && (
                <Alert color="blue" title="Multiple tenants" variant="light">
                  Your account belongs to multiple tenants. Choose which one to open.
                </Alert>
              )}
              <TextInput
                label="Email"
                placeholder="you@company.com"
                {...form.getInputProps('email')}
                disabled={Boolean(tenantChoices)}
              />
              <PasswordInput
                label="Password"
                {...form.getInputProps('password')}
                disabled={Boolean(tenantChoices)}
              />
              {tenantChoices ? (
                <Select
                  label="Tenant"
                  placeholder="Select a tenant"
                  data={tenantSelectData}
                  searchable
                  nothingFoundMessage="No matches"
                  {...form.getInputProps('tenantSlug')}
                />
              ) : (
                <TextInput
                  label="Tenant slug"
                  description="Optional if you belong to only one tenant"
                  placeholder="my-property"
                  {...form.getInputProps('tenantSlug')}
                />
              )}
              {tenantChoices && (
                <Button
                  variant="subtle"
                  size="compact-sm"
                  onClick={() => {
                    setTenantChoices(null)
                    form.setFieldValue('tenantSlug', '')
                    form.clearFieldError('tenantSlug')
                  }}
                >
                  Use another account
                </Button>
              )}
              <Button type="submit" fullWidth mt="sm">
                {tenantChoices ? 'Enter tenant' : 'Continue'}
              </Button>
            </Stack>
          </form>
          <Text size="sm" mt="md" ta="center">
            New tenant?{' '}
            <Anchor component={Link} to="/register" size="sm">
              Create tenant
            </Anchor>
          </Text>
        </Paper>
      </Stack>
    </Stack>
  )
}
