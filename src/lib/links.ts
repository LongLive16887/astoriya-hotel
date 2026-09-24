/** Keeps only digits and a leading plus: "+998 55 705-00-10" → "+998557050010". */
export function normalizePhone(phone: string): string {
  const trimmed = phone.trim()
  const digits = trimmed.replace(/\D/g, '')
  return trimmed.startsWith('+') ? `+${digits}` : digits
}

export const telHref = (phone: string) => `tel:${normalizePhone(phone)}`

const cleanHandle = (handle: string) =>
  handle
    .trim()
    .replace(/^https?:\/\/(www\.)?(t\.me|telegram\.me|instagram\.com)\//i, '')
    .replace(/^@/, '')
    .replace(/\/.*$/, '')

export const telegramHref = (username: string) => `https://t.me/${cleanHandle(username)}`

export const instagramHref = (username: string) =>
  `https://www.instagram.com/${cleanHandle(username)}/`

export function whatsappHref(phone: string, text?: string): string {
  const digits = normalizePhone(phone).replace('+', '')
  return `https://wa.me/${digits}${text ? `?text=${encodeURIComponent(text)}` : ''}`
}

export const handleLabel = (username: string) => `@${cleanHandle(username)}`

export const googleDirectionsHref = (lat: number, lng: number) =>
  `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`

export const yandexMapsHref = (lat: number, lng: number) =>
  `https://yandex.com/maps/?pt=${lng},${lat}&z=17&l=map`

/** Allows only web, phone and mail links; anything else becomes "#". */
export function safeHref(url: string): string {
  const value = url.trim()
  if (/^(https?:|tel:|mailto:)/i.test(value) || value.startsWith('/')) return value
  return '#'
}

/** Only Google Maps embeds are allowed in the map iframe. */
export function safeMapEmbed(url: string): string | null {
  const value = url.trim()
  return /^https:\/\/(www\.)?google\.[a-z.]+\/maps\/embed/i.test(value) ? value : null
}
