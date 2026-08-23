import { Alert, Anchor, Button, PasswordInput, Select, Stack, Text, TextInput } from '@mantine/core'
import { useForm } from '@mantine/form'
import { notifications } from '@mantine/notifications'
import { useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { api } from '../../../api/client'
import type { AuthResponse, LoginTenantOption } from '../../../api/types'
import { FeatureCodes } from '../../../lib/permissions'
import { applyAuthSession } from '../../auth/applyAuthSession'
import { getLoginErrorMessage, parseMultipleTenantsLoginError } from '../../auth/loginErrors'
import '../layouts/portal.css'

export function PortalLoginPage() {
  const navigate = useNavigate()
  const [tenantChoices, setTenantChoices] = useState<LoginTenantOption[] | null>(null)
  const tenantChoicesRef = useRef<LoginTenantOption[] | null>(null)
  tenantChoicesRef.current = tenantChoices

  const form = useForm({
    initialValues: { email: '', password: '', tenantSlug: '' },
    validate: {
      email: (v) => (/^\S+@\S+$/.test(v) ? null : 'Inválido'),
      password: (v) => (v.length < 6 ? 'Mínimo 6 caracteres' : null),
      tenantSlug: (v) => (tenantChoicesRef.current && !v ? 'Selecciona un tenant' : null),
    },
  })

  const completeLogin = (data: AuthResponse) => {
    applyAuthSession(data)

    if (data.modules && data.modules.portal === false) {
      notifications.show({
        title: 'Portal no disponible',
        message: 'Este conjunto no tiene el módulo Portal activado.',
        color: 'orange',
      })
      return
    }

    const canPortal = (data.permissions ?? []).includes(FeatureCodes.portalAccess)
    if (!canPortal || !data.hasPersonLink) {
      notifications.show({
        title: 'Sin acceso portal',
        message: 'Tu usuario no está vinculado a una persona o no tiene permiso de portal. Usa la app de administración.',
        color: 'orange',
      })
      navigate('/dashboard', { replace: true })
      return
    }

    notifications.show({ title: 'Bienvenido', message: data.tenantSlug, color: 'teal' })
    navigate('/portal', { replace: true })
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
          form.setFieldValue('tenantSlug', multiTenant.tenants[0]!.slug)
        }
        form.setFieldError('tenantSlug', 'Selecciona un tenant')
        return
      }
      form.setErrors({ email: getLoginErrorMessage(err) })
    }
  })

  return (
    <div className="portal-login-page">
      <form className="portal-login-card" onSubmit={submit}>
        <Stack gap="md">
          <Stack gap={4}>
            <Text className="portal-login-brand">Portal</Text>
            <Text c="dimmed" size="sm">
              Acceso para propietarios y residentes
            </Text>
          </Stack>

          <TextInput label="Correo" required {...form.getInputProps('email')} />
          <PasswordInput label="Contraseña" required {...form.getInputProps('password')} />
          {tenantChoices ? (
            <Select
              label="Conjunto"
              data={tenantChoices.map((t) => ({ value: t.slug, label: t.name }))}
              {...form.getInputProps('tenantSlug')}
            />
          ) : null}

          {form.errors.email ? <Alert color="red">{form.errors.email}</Alert> : null}

          <Button type="submit" color="teal">
            Entrar
          </Button>

          <Text size="sm" c="dimmed" ta="center">
            ¿Eres administrador?{' '}
            <Anchor component={Link} to="/login">
              Ir a la app
            </Anchor>
          </Text>
        </Stack>
      </form>
    </div>
  )
}
