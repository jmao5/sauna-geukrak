import { create } from 'zustand'

export type Condition = 'autoloyly' | 'groundwater' | 'jjimjilbang' | 'tattoo' | 'female' | 'male' | 'parking'
export type SortKey = 'default' | 'rating' | 'reviews' | 'temp_hot' | 'temp_cold' | 'price_asc'

interface HomeFilterState {
  keyword: string
  selectedRegion: string | null
  selectedConds: Condition[]
  sortKey: SortKey
  showMoreFilters: boolean
  regionOpen: boolean
  conditionOpen: boolean
  sortOpen: boolean

  // Actions
  setKeyword: (keyword: string) => void
  setSelectedRegion: (region: string | null) => void
  toggleCondition: (cond: Condition) => void
  setSortKey: (key: SortKey) => void
  setShowMoreFilters: (show: boolean | ((prev: boolean) => boolean)) => void
  setRegionOpen: (open: boolean) => void
  setConditionOpen: (open: boolean) => void
  setSortOpen: (open: boolean) => void
  resetAll: () => void
}

export const useHomeFilterStore = create<HomeFilterState>((set) => ({
  keyword: '',
  selectedRegion: null,
  selectedConds: [],
  sortKey: 'default',
  showMoreFilters: false,
  regionOpen: false,
  conditionOpen: false,
  sortOpen: false,

  setKeyword: (keyword) => set({ keyword }),
  setSelectedRegion: (region) => set({ selectedRegion: region }),
  toggleCondition: (cond) => set((state) => ({
    selectedConds: state.selectedConds.includes(cond)
      ? state.selectedConds.filter((c) => c !== cond)
      : [...state.selectedConds, cond],
  })),
  setSortKey: (key) => set({ sortKey: key }),
  setShowMoreFilters: (show) => set((state) => ({
    showMoreFilters: typeof show === 'function' ? show(state.showMoreFilters) : show,
  })),
  setRegionOpen: (open) => set({ regionOpen: open }),
  setConditionOpen: (open) => set({ conditionOpen: open }),
  setSortOpen: (open) => set({ sortOpen: open }),
  resetAll: () => set({
    keyword: '',
    selectedRegion: null,
    selectedConds: [],
    sortKey: 'default',
  }),
}))
