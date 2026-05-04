export interface SaunaRoom {
  type: '건식' | '습식' | '핀란드식' | '한증막' | '불가마' | string
  gender: 'male' | 'female' | 'both'
  temp: number
  capacity: number
  has_tv: boolean
  has_auto_loyly: boolean
  has_self_loyly?: boolean
}

export interface ColdBath {
  temp: number
  gender: 'male' | 'female' | 'both'
  capacity: number
  is_groundwater: boolean
  depth: number
}

export interface RestingArea {
  indoor_seats: number
  outdoor_seats: number
  infinity_chairs: number
  deck_chairs: number
}

export interface Amenities {
  towel: boolean
  shampoo: boolean
  body_wash: boolean
  hair_dryer: boolean
  water_dispenser?: boolean
}

export interface Rules {
  tattoo_allowed: boolean
  female_allowed: boolean
  male_allowed: boolean
}

export interface KrSpecific {
  has_jjimjilbang: boolean
  sesin_price_male: number
  sesin_price_female: number
  food: string[]
}

export interface Pricing {
  adult_day: number
  adult_night: number
  child: number
}

export interface InstagramMedia {
  url: string
  type: 'reel' | 'post'
  caption?: string
  thumbnail_url?: string
}

export interface Session {
  type: 'sauna' | 'cold' | 'rest'
  duration_minutes: number
  temp?: number
  note?: string
}

export interface ReviewUser {
  id: string
  nickname: string
  avatar_url: string | null
}

export interface ReviewDto {
  id: string
  rating: number
  content: string | null
  visit_date: string | null
  visit_time: string | null
  congestion: string | null
  sessions: Session[]
  images: string[]
  like_count: number
  created_at: string
  users: ReviewUser | null
}

export interface MyReviewDto extends Omit<ReviewDto, 'users' | 'congestion' | 'images'> {
  saunas: SaunaSummaryDto | null
}

export interface MyFavoriteDto {
  sauna_id: string
  created_at: string
  memo?: string | null
  status?: 'want' | 'visited'
  saunas: SaunaSummaryDto | null
}

export interface SaunaDto {
  id: string
  name: string
  address: string
  latitude: number
  longitude: number
  sauna_rooms: SaunaRoom[]
  cold_baths: ColdBath[]
  resting_area: RestingArea
  amenities: Amenities
  rules: Rules
  kr_specific: KrSpecific
  pricing: Pricing
  business_hours: string
  contact: string
  parking: boolean
  images: string[]
  instagram_media: InstagramMedia[]
  floor_plan_images: string[]
  created_at: string
  review_count?: number
  avg_rating?: number | null
}

export interface SaunaSummaryDto {
  id: string
  name: string
  address: string
  latitude: number
  longitude: number
  sauna_rooms: SaunaRoom[]
  cold_baths: ColdBath[]
  pricing?: Pricing
  rules?: Rules
  kr_specific?: KrSpecific
  images?: string[]
  avg_rating?: number | null
  review_count?: number
  is_featured?: boolean
}
