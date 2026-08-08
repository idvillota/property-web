import axios from 'axios'
import type { LoginTenantOption, MultipleTenantsLoginError } from '../../api/types'

export function getLoginErrorMessage(err: unknown, fallback = 'Could not sign in'): string {
  if (axios.isAxiosError(err)) {
    const data = err.response?.data as { message?: string } | undefined
    if (data?.message) return String(data.message)
  }
  return fallback
}

export function parseMultipleTenantsLoginError(err: unknown): MultipleTenantsLoginError | null {
  if (!axios.isAxiosError(err) || err.response?.status !== 400) return null

  const data = err.response.data as {
    code?: string
    message?: string
    tenants?: Array<{ slug?: string; name?: string }>
  }

  if (data.code !== 'multiple_tenants' || !Array.isArray(data.tenants)) return null

  const tenants: LoginTenantOption[] = data.tenants
    .map((t) => ({
      slug: t.slug ?? (t as { Slug?: string }).Slug,
      name: t.name ?? (t as { Name?: string }).Name,
    }))
    .filter((t): t is LoginTenantOption => Boolean(t.slug && t.name))

  if (tenants.length === 0) return null

  return {
    code: 'multiple_tenants',
    message: data.message ?? 'Your account belongs to multiple tenants. Choose which one to open.',
    tenants,
  }
}
