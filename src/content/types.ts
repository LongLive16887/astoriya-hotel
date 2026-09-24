export const LANGS = ['uz', 'ru', 'en'] as const
export type Lang = (typeof LANGS)[number]

/** Text stored in all three site languages. Empty strings fall back to another language. */
export type Localized = Record<Lang, string>

export const AMENITIES = [
  'wifi',
  'breakfast',
  'ac',
  'tv',
  'fridge',
  'kettle',
  'safe',
  'wardrobe',
  'shower',
  'toiletries',
  'hairdryer',
  'desk',
  'balcony',
  'cityView',
  'roomService',
] as const
export type Amenity = (typeof AMENITIES)[number]

export const SERVICE_ICONS = [
  'waves',
  'flame',
  'droplets',
  'utensils',
  'coffee',
  'sunset',
  'concierge',
  'clock',
  'currency',
  'wifi',
  'trees',
  'car',
  'plane',
  'shirt',
  'baby',
  'dumbbell',
  'bath',
  'key',
  'map',
  'luggage',
  'shield',
  'heart',
  'star',
  'sparkles',
] as const
export type ServiceIcon = (typeof SERVICE_ICONS)[number]

export const GALLERY_CATEGORIES = ['rooms', 'spa', 'terrace', 'exterior', 'other'] as const
export type GalleryCategory = (typeof GALLERY_CATEGORIES)[number]

export interface Highlight {
  value: string
  label: Localized
}

export interface SiteSettings {
  hotelName: string
  phone: string
  phone2: string
  email: string
  /** Telegram username without @ */
  telegram: string
  /** Instagram username without @ */
  instagram: string
  /** WhatsApp number in international format, optional */
  whatsapp: string
  address: Localized
  mapUrl: string
  mapEmbedUrl: string
  location: { lat: number; lng: number }
  checkIn: string
  checkOut: string
  hero: {
    title: Localized
    subtitle: Localized
    image: string
    secondaryImage: string
  }
  about: {
    title: Localized
    text: Localized
    image: string
    secondaryImage: string
  }
  spa: {
    title: Localized
    text: Localized
    image: string
  }
  highlights: Highlight[]
}

export interface Room {
  id: string
  visible: boolean
  name: Localized
  summary: Localized
  description: Localized
  priceUzs: number
  priceUsd: number
  guests: number
  beds: Localized
  /** Square metres, 0 hides the value */
  area: number
  amenities: Amenity[]
  images: string[]
}

export interface Service {
  id: string
  visible: boolean
  icon: ServiceIcon
  title: Localized
  text: Localized
}

export interface GalleryImage {
  id: string
  src: string
  caption: Localized
  category: GalleryCategory
}

export interface Review {
  id: string
  visible: boolean
  author: Localized
  origin: Localized
  text: Localized
  /** 1–5, 0 hides the stars */
  rating: number
  source: string
  /** YYYY-MM or empty */
  date: string
}

export interface Post {
  id: string
  published: boolean
  /** YYYY-MM-DD */
  date: string
  title: Localized
  excerpt: Localized
  body: Localized
  image: string
}

export interface SiteContent {
  settings: SiteSettings
  rooms: Room[]
  services: Service[]
  gallery: GalleryImage[]
  reviews: Review[]
}

/** Documents of the `content` collection that hold arrays of items. */
export type ListKey = 'rooms' | 'services' | 'gallery' | 'reviews'
export type ContentKey = 'settings' | ListKey

export const BOOKING_STATUSES = ['new', 'confirmed', 'completed', 'cancelled'] as const
export type BookingStatus = (typeof BOOKING_STATUSES)[number]

/** Fields a guest submits from the public booking form. */
export interface BookingRequest {
  name: string
  phone: string
  email: string
  checkIn: string
  checkOut: string
  adults: number
  children: number
  roomId: string
  roomName: string
  message: string
  lang: Lang
}
