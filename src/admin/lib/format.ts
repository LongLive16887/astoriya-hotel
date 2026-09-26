import { formatDate, nightsBetween } from '../../lib/format'
import type { Booking } from './bookings'

const plurals = new Intl.PluralRules('ru-RU')

/** plural(3, 'ночь', 'ночи', 'ночей') → "3 ночи" */
export function plural(n: number, one: string, few: string, many: string): string {
  const form = plurals.select(n)
  return `${n} ${form === 'one' ? one : form === 'few' ? few : many}`
}

export const nightsLabel = (n: number) => plural(n, 'ночь', 'ночи', 'ночей')

export function guestsLabel(adults: number, children: number): string {
  const parts = [plural(adults, 'взрослый', 'взрослых', 'взрослых')]
  if (children > 0) parts.push(plural(children, 'ребёнок', 'ребёнка', 'детей'))
  return parts.join(', ')
}

const short = (iso: string) => formatDate(iso, 'ru', { day: 'numeric', month: 'short' })

/** "24 сент. → 26 сент. · 2 ночи" */
export function stayLabel(b: Pick<Booking, 'checkIn' | 'checkOut'>): string {
  if (!b.checkIn || !b.checkOut) return '—'
  const nights = nightsBetween(b.checkIn, b.checkOut)
  return `${short(b.checkIn)} → ${short(b.checkOut)}${nights ? ` · ${nightsLabel(nights)}` : ''}`
}

const dateTime = new Intl.DateTimeFormat('ru-RU', {
  day: 'numeric',
  month: 'short',
  hour: '2-digit',
  minute: '2-digit',
})

export const formatDateTime = (date: Date | null) => (date ? dateTime.format(date) : '—')

/**
 * Guests type numbers in many ways; call and messenger links need the international form.
 * Returns null when the country code cannot be worked out.
 */
export function internationalPhone(phone: string): string | null {
  const typed = phone.trim()
  const digits = typed.replace(/\D/g, '')
  if (!digits) return null
  if (typed.startsWith('+')) return `+${digits}`
  if (digits.startsWith('00')) return `+${digits.slice(2)}`
  // Uzbekistan without the country code: 90 123 45 67, or with the old trunk prefix 8 90 123 45 67.
  if (digits.length === 9) return `+998${digits}`
  if (digits.length === 10 && digits.startsWith('8')) return `+998${digits.slice(1)}`
  // Russia and Kazakhstan: 8 (912) 000-00-00.
  if (digits.length === 11 && digits.startsWith('8')) return `+7${digits.slice(1)}`
  // Long enough to include a country code.
  if (digits.length >= 11 && !digits.startsWith('0')) return `+${digits}`
  return null
}

export const LANG_LABELS = { uz: 'узбекский', ru: 'русский', en: 'английский' } as const

export function greeting(now = new Date()): string {
  const hour = now.getHours()
  if (hour < 5) return 'Доброй ночи'
  if (hour < 12) return 'Доброе утро'
  if (hour < 18) return 'Добрый день'
  return 'Добрый вечер'
}
