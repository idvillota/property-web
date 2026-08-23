import { Alert, Anchor, Button, Paper, PasswordInput, Select, Stack, Text, TextInput, Title } from '@mantine/core'
import { useForm } from '@mantine/form'
import { notifications } from '@mantine/notifications'
import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { resolveDefaultLandingPath } from '../../../app/navConfig'
import { api } from '../../../api/client'
import type { AuthResponse, HorizontalProperty, LoginTenantOption } from '../../../api/types'
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
      title: 'Sesión expirada',
      message: 'Inicia sesión de nuevo para continuar.',
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
      email: (v) => (/^\S+@\S+$/.test(v) ? null : 'Inválido'),
      password: (v) => (v.length < 6 ? 'Mínimo 6 caracteres' : null),
      tenantSlug: (v) => (tenantChoicesRef.current && !v ? 'Selecciona un tenant' : null),
    },
  })

  const completeLogin = async (data: AuthResponse) => {
    applyAuthSession(data)
    notifications.show({ title: 'Bienvenido', message: data.tenantSlug, color: 'teal' })
    const returnUrl = searchParams.get('returnUrl')
    if (returnUrl && returnUrl.startsWith('/') && !returnUrl.startsWith('//')) {
      navigate(returnUrl)
      return
    }

    let propertyId: string | null = null
    try {
      const { data: property } = await api.get<HorizontalProperty>('/api/HorizontalProperties/current')
      propertyId = property.id
    } catch {
      propertyId = null
    }

    navigate(resolveDefaultLandingPath(data.permissions, propertyId, data.isPlatformAdmin, data.modules))
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
        form.setFieldError('tenantSlug', 'Selecciona un tenant')
        return
      }

      setTenantChoices(null)
      notifications.show({
        title: 'No se pudo iniciar sesión',
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
            Iniciar sesión
          </Title>
          <Text c="dimmed" size="sm" mb="lg" ta="center">
            Plataforma de administración de copropiedades
          </Text>
          <form onSubmit={submit}>
            <Stack gap="sm">
              {tenantChoices && (
                <Alert color="blue" title="Varios tenants" variant="light">
                  Tu cuenta pertenece a varios tenants. Elige con cuál entrar.
                </Alert>
              )}
              <TextInput
                label="Correo"
                placeholder="tu@empresa.com"
                {...form.getInputProps('email')}
                disabled={Boolean(tenantChoices)}
              />
              <PasswordInput
                label="Contraseña"
                {...form.getInputProps('password')}
                disabled={Boolean(tenantChoices)}
              />
              {tenantChoices ? (
                <Select
                  label="Tenant"
                  placeholder="Selecciona un tenant"
                  data={tenantSelectData}
                  searchable
                  nothingFoundMessage="Sin coincidencias"
                  {...form.getInputProps('tenantSlug')}
                />
              ) : (
                <TextInput
                  label="Slug del tenant"
                  description="Opcional si solo perteneces a un tenant"
                  placeholder="mi-propiedad"
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
                  Usar otra cuenta
                </Button>
              )}
              <Button type="submit" fullWidth mt="sm">
                {tenantChoices ? 'Entrar al tenant' : 'Continuar'}
              </Button>
            </Stack>
          </form>
          <Text size="sm" mt="md" ta="center">
            ¿Nuevo tenant?{' '}
            <Anchor component={Link} to="/register" size="sm">
              Crear tenant
            </Anchor>
          </Text>
        </Paper>
      </Stack>
    </Stack>
  )
}
