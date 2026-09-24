import {
  AMENITIES,
  GALLERY_CATEGORIES,
  SERVICE_ICONS,
  type Amenity,
  type ContentKey,
  type GalleryImage,
  type Highlight,
  type ListKey,
  type Localized,
  type Post,
  type Review,
  type Room,
  type Service,
  type SiteContent,
  type SiteSettings,
} from './types'

// Firestore data is edited by people (and can be edited by hand in the console),
// so everything read from it is coerced into the expected shape here.

type Obj = Record<string, unknown>

const isObj = (v: unknown): v is Obj => typeof v === 'object' && v !== null && !Array.isArray(v)
const str = (v: unknown, fallback = ''): string => (typeof v === 'string' ? v : fallback)
const num = (v: unknown, fallback = 0): number =>
  typeof v === 'number' && Number.isFinite(v) ? v : fallback
const bool = (v: unknown, fallback: boolean): boolean => (typeof v === 'boolean' ? v : fallback)
const arr = (v: unknown): unknown[] => (Array.isArray(v) ? v : [])
const isStr = (v: unknown): v is string => typeof v === 'string' && v.length > 0

function loc(v: unknown, fallback?: Localized): Localized {
  const o = isObj(v) ? v : {}
  return {
    uz: str(o.uz, fallback?.uz ?? ''),
    ru: str(o.ru, fallback?.ru ?? ''),
    en: str(o.en, fallback?.en ?? ''),
  }
}

function oneOf<T extends string>(values: readonly T[], v: unknown, fallback: T): T {
  return typeof v === 'string' && (values as readonly string[]).includes(v) ? (v as T) : fallback
}

const hasId = (v: unknown): v is Obj & { id: string } => isObj(v) && isStr(v.id)

export function normalizeSettings(raw: unknown, d: SiteSettings): SiteSettings {
  const o = isObj(raw) ? raw : {}
  const hero = isObj(o.hero) ? o.hero : {}
  const about = isObj(o.about) ? o.about : {}
  const spa = isObj(o.spa) ? o.spa : {}
  const location = isObj(o.location) ? o.location : {}
  return {
    hotelName: str(o.hotelName, d.hotelName),
    phone: str(o.phone, d.phone),
    phone2: str(o.phone2, d.phone2),
    email: str(o.email, d.email),
    telegram: str(o.telegram, d.telegram),
    instagram: str(o.instagram, d.instagram),
    whatsapp: str(o.whatsapp, d.whatsapp),
    address: loc(o.address, d.address),
    mapUrl: str(o.mapUrl, d.mapUrl),
    mapEmbedUrl: str(o.mapEmbedUrl, d.mapEmbedUrl),
    location: {
      lat: num(location.lat, d.location.lat),
      lng: num(location.lng, d.location.lng),
    },
    checkIn: str(o.checkIn, d.checkIn),
    checkOut: str(o.checkOut, d.checkOut),
    hero: {
      title: loc(hero.title, d.hero.title),
      subtitle: loc(hero.subtitle, d.hero.subtitle),
      image: str(hero.image, d.hero.image),
      secondaryImage: str(hero.secondaryImage, d.hero.secondaryImage),
    },
    about: {
      title: loc(about.title, d.about.title),
      text: loc(about.text, d.about.text),
      image: str(about.image, d.about.image),
      secondaryImage: str(about.secondaryImage, d.about.secondaryImage),
    },
    spa: {
      title: loc(spa.title, d.spa.title),
      text: loc(spa.text, d.spa.text),
      image: str(spa.image, d.spa.image),
    },
    highlights: Array.isArray(o.highlights)
      ? o.highlights.filter(isObj).map(
          (h): Highlight => ({ value: str(h.value), label: loc(h.label) }),
        )
      : d.highlights,
  }
}

export function normalizeRoom(v: unknown): Room | null {
  if (!hasId(v)) return null
  return {
    id: v.id,
    visible: bool(v.visible, true),
    name: loc(v.name),
    summary: loc(v.summary),
    description: loc(v.description),
    priceUzs: num(v.priceUzs),
    priceUsd: num(v.priceUsd),
    guests: num(v.guests, 2),
    beds: loc(v.beds),
    area: num(v.area),
    amenities: arr(v.amenities).filter((a): a is Amenity =>
      (AMENITIES as readonly unknown[]).includes(a),
    ),
    images: arr(v.images).filter(isStr),
  }
}

export function normalizeService(v: unknown): Service | null {
  if (!hasId(v)) return null
  return {
    id: v.id,
    visible: bool(v.visible, true),
    icon: oneOf(SERVICE_ICONS, v.icon, 'sparkles'),
    title: loc(v.title),
    text: loc(v.text),
  }
}

export function normalizeGalleryImage(v: unknown): GalleryImage | null {
  if (!hasId(v) || !isStr(v.src)) return null
  return {
    id: v.id,
    src: v.src,
    caption: loc(v.caption),
    category: oneOf(GALLERY_CATEGORIES, v.category, 'other'),
  }
}

export function normalizeReview(v: unknown): Review | null {
  if (!hasId(v)) return null
  const rating = Math.round(num(v.rating))
  return {
    id: v.id,
    visible: bool(v.visible, true),
    author: loc(v.author),
    origin: loc(v.origin),
    text: loc(v.text),
    rating: rating >= 1 && rating <= 5 ? rating : 0,
    source: str(v.source),
    date: str(v.date),
  }
}

export function normalizePost(id: string, v: unknown): Post {
  const o = isObj(v) ? v : {}
  return {
    id,
    published: bool(o.published, false),
    date: str(o.date),
    title: loc(o.title),
    excerpt: loc(o.excerpt),
    body: loc(o.body),
    image: str(o.image),
  }
}

type ListItem = SiteContent[ListKey][number]

/** Item normalizers for the documents that hold lists. */
export const LIST_NORMALIZERS: { [K in ListKey]: (v: unknown) => SiteContent[K][number] | null } = {
  rooms: normalizeRoom,
  services: normalizeService,
  gallery: normalizeGalleryImage,
  reviews: normalizeReview,
}

/** Reads `{ items: [...] }` from a list document, dropping broken and duplicate items. */
export function normalizeList<T extends ListItem>(
  raw: unknown,
  normalizeItem: (v: unknown) => T | null,
): T[] {
  const items = isObj(raw) ? arr(raw.items) : []
  const seen = new Set<string>()
  const result: T[] = []
  for (const item of items) {
    const normalized = normalizeItem(item)
    if (!normalized || seen.has(normalized.id)) continue
    seen.add(normalized.id)
    result.push(normalized)
  }
  return result
}

/**
 * Builds site content from raw `content/*` documents.
 * A missing document (undefined) means "not saved yet" and falls back to the defaults.
 */
export function normalizeContent(
  docs: Partial<Record<ContentKey, unknown>>,
  defaults: SiteContent,
): SiteContent {
  const list = <K extends ListKey>(key: K): SiteContent[K] =>
    (docs[key] === undefined
      ? defaults[key]
      : normalizeList(docs[key], LIST_NORMALIZERS[key])) as SiteContent[K]
  return {
    settings:
      docs.settings === undefined
        ? defaults.settings
        : normalizeSettings(docs.settings, defaults.settings),
    rooms: list('rooms'),
    services: list('services'),
    gallery: list('gallery'),
    reviews: list('reviews'),
  }
}
