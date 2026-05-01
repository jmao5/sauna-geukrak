import { useState } from 'react'
import { SaunaDto, SaunaRoom, ColdBath } from '@/types/sauna'

export type FormState = Omit<SaunaDto, 'id' | 'created_at'>

export const defaultSaunaRoom = (): SaunaRoom => ({
  type: '건식',
  temp: 85,
  capacity: 10,
  has_tv: false,
  has_auto_loyly: false,
  has_self_loyly: false,
})

export const defaultColdBath = (): ColdBath => ({
  temp: 15,
  capacity: 4,
  is_groundwater: false,
  depth: 80,
})

export const defaultForm = (): FormState => ({
  name: '',
  address: '',
  latitude: 0,
  longitude: 0,
  sauna_rooms: [defaultSaunaRoom()],
  cold_baths: [defaultColdBath()],
  resting_area: { indoor_seats: 0, outdoor_seats: 0, infinity_chairs: 0, deck_chairs: 0 },
  amenities: { towel: false, shampoo: false, body_wash: false, hair_dryer: false, water_dispenser: false },
  rules: { tattoo_allowed: false, female_allowed: true, male_allowed: true },
  kr_specific: { has_jjimjilbang: false, sesin_price_male: 0, sesin_price_female: 0, food: [] },
  pricing: { adult_day: 0, adult_night: 0, child: 0 },
  business_hours: '',
  contact: '',
  parking: false,
  images: [],
  instagram_media: [],
  floor_plan_images: [],
})

export function useSaunaForm(initialData?: FormState | null) {
  const [form, setForm] = useState<FormState>(initialData ?? defaultForm())

  const onChange = (patch: Partial<FormState>) => {
    setForm((prev) => ({ ...prev, ...patch }))
  }

  const updateRoom = (i: number, patch: Partial<SaunaRoom>) => {
    const rooms = [...form.sauna_rooms]
    rooms[i] = { ...rooms[i], ...patch }
    onChange({ sauna_rooms: rooms })
  }

  const addRoom = () => {
    onChange({ sauna_rooms: [...form.sauna_rooms, defaultSaunaRoom()] })
  }

  const removeRoom = (i: number) => {
    onChange({ sauna_rooms: form.sauna_rooms.filter((_, idx) => idx !== i) })
  }

  const updateBath = (i: number, patch: Partial<ColdBath>) => {
    const baths = [...form.cold_baths]
    baths[i] = { ...baths[i], ...patch }
    onChange({ cold_baths: baths })
  }

  const addBath = () => {
    onChange({ cold_baths: [...form.cold_baths, defaultColdBath()] })
  }

  const removeBath = (i: number) => {
    onChange({ cold_baths: form.cold_baths.filter((_, idx) => idx !== i) })
  }

  return {
    form,
    setForm,
    onChange,
    updateRoom,
    addRoom,
    removeRoom,
    updateBath,
    addBath,
    removeBath,
  }
}
