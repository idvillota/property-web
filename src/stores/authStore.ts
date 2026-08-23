import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { TenantModuleFlags } from '../api/types'
import { DEFAULT_TENANT_MODULES } from '../features/settings/lib/tenantModuleFlags'

export type AuthPayload = {
  token: string
  tenantSlug: string
  email: string
  roles: string[]
  permissions: string[]
  isPlatformAdmin: boolean
  modules: TenantModuleFlags
}

type AuthState = AuthPayload & {
  setAuth: (payload: AuthPayload) => void
  setModules: (modules: TenantModuleFlags) => void
  clear: () => void
  hasPermission: (code: string) => boolean
}

const empty: AuthPayload = {
  token: '',
  tenantSlug: '',
  email: '',
  roles: [],
  permissions: [],
  isPlatformAdmin: false,
  modules: { ...DEFAULT_TENANT_MODULES },
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      ...empty,
      setAuth: (payload) => set(payload),
      setModules: (modules) => set({ modules }),
      clear: () => set(empty),
      hasPermission: (code) => get().permissions.includes(code),
    }),
    {
      name: 'property-auth',
      partialize: (s) => ({
        token: s.token,
        tenantSlug: s.tenantSlug,
        email: s.email,
        roles: s.roles,
        permissions: s.permissions,
        isPlatformAdmin: s.isPlatformAdmin,
        modules: s.modules,
      }),
    },
  ),
)
