export interface SaunaRoom {
  type: '건식' | '습식' | '핀란드식' | '한증막' | '불가마' | string
  temp: number
  capacity: number
  has_tv: boolean
  has_auto_loyly: boolean
  has_self_loyly?: boolean
}

export interface ColdBath {
  temp: number
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

/** 인스타그램 릴스/피드 미디어 항목 */
export interface InstagramMedia {
  url: string           // 인스타그램 게시물 URL
  type: 'reel' | 'post'
  caption?: string      // 선택적 설명
  thumbnail_url?: string // 직접 지정한 썸네일 (없으면 oEmbed 시도)
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
  created_at: string
  users: ReviewUser | null
}

export interface MyReviewDto extends Omit<ReviewDto, 'users' | 'congestion' | 'images'> {
  saunas: SaunaSummaryDto | null
}

export interface MyFavoriteDto {
  sauna_id: string
  created_at: string
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
