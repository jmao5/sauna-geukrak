import { create, StateCreator } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'

interface UiState {
  theme: 'light' | 'dark'
  toggleTheme: () => void
  setTheme: (theme: 'light' | 'dark') => void
}

const stateInitializer: StateCreator<UiState> = (set) => ({
  theme: 'light',
  toggleTheme: () =>
    set((state) => ({
      theme: state.theme === 'light' ? 'dark' : 'light',
    })),
  setTheme: (theme) => set({ theme }),
})

export const useUiStore = create<UiState>()(
  persist(stateInitializer, {
    name: 'ui-storage',
    storage: createJSONStorage(() => localStorage),
  }) as StateCreator<UiState>,
)
