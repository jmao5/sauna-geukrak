import { create } from 'zustand'
import type { User, Session } from '@supabase/supabase-js'

interface UserStore {
  user: User | null
  session: Session | null
  isLoading: boolean
  /** Supabase access_token 반환 (없으면 null) */
  accessToken: () => string | null
  setSession: (session: Session | null) => void
  setLoading: (loading: boolean) => void
  clearSession: () => void
}

export const useUserStore = create<UserStore>((set, get) => ({
  user: null,
  session: null,
  isLoading: true,

  accessToken: () => get().session?.access_token ?? null,

  setSession: (session) =>
    set({
      session,
      user: session?.user ?? null,
      isLoading: false,
    }),

  setLoading: (isLoading) => set({ isLoading }),

  clearSession: () =>
    set({
      user: null,
      session: null,
      isLoading: false,
    }),
}))
