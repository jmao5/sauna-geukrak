import { create } from 'zustand'
import type { User, Session } from '@supabase/supabase-js'

interface UserStore {
  user: User | null
  session: Session | null
  isLoading: boolean
  role: 'user' | 'admin' | null
  /** Supabase access_token 반환 (없으면 null) */
  accessToken: () => string | null
  isAdmin: () => boolean
  setSession: (session: Session | null) => void
  setRole: (role: 'user' | 'admin' | null) => void
  setLoading: (loading: boolean) => void
  clearSession: () => void
}

export const useUserStore = create<UserStore>((set, get) => ({
  user: null,
  session: null,
  isLoading: true,
  role: null,

  accessToken: () => get().session?.access_token ?? null,
  isAdmin: () => get().role === 'admin',

  setSession: (session) =>
    set({
      session,
      user: session?.user ?? null,
      isLoading: false,
    }),

  setRole: (role) => set({ role }),

  setLoading: (isLoading) => set({ isLoading }),

  clearSession: () =>
    set({
      user: null,
      session: null,
      role: null,
      isLoading: false,
    }),
}))
