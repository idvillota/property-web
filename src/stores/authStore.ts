import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type AuthPayload = {
  token: string
  tenantSlug: string
  email: string
  roles: string[]
  permissions: string[]
  isPlatformAdmin: boolean
}

type AuthState = AuthPayload & {
  setAuth: (payload: AuthPayload) => void
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
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      ...empty,
      setAuth: (payload) => set(payload),
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
      }),
    },
  ),
)
