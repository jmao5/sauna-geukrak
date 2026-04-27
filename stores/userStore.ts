import { create, StateCreator } from 'zustand'
import { UserData } from '@/types/user'

interface UserStore {
  user: UserData | null
  setUser: (user: UserData) => void
  clearUser: () => void
}

const stateInitializer: StateCreator<UserStore> = (set) => ({
  user: null,
  setUser: (user) => set({ user }),
  clearUser: () => set({ user: null }),
})

export const useUserStore = create<UserStore>()(stateInitializer)
