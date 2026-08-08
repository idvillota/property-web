import { api } from './client'
import type { PlatformTenantsStatus } from './types'

export async function getPlatformTenantsStatus(): Promise<PlatformTenantsStatus> {
  const { data } = await api.get<PlatformTenantsStatus>('/api/platform/tenants/status')
  return data
}
