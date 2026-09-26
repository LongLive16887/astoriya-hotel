import type { Lang } from '../content/types'

const LOCALES: Record<Lang, string> = { uz: 'uz-Latn-UZ', ru: 'ru-RU', en: 'en-GB' }

export const localeOf = (lang: Lang) => LOCALES[lang]

const CURRENCY_LABEL: Record<Lang, string> = { uz: 'soʻm', ru: 'сум', en: 'UZS' }

/** 1700000 → "1 700 000 сум" */
export function formatUzs(amount: number, lang: Lang): string {
  const digits = new Intl.NumberFormat(LOCALES[lang], { maximumFractionDigits: 0 }).format(amount)
  return `${digits} ${CURRENCY_LABEL[lang]}`
}

/** 130 → "$130" */
export function formatUsd(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(amount)
}

const ISO_DATE = /^(\d{4})-(\d{2})-(\d{2})$/
const ISO_MONTH = /^(\d{4})-(\d{2})$/

/** Parses YYYY-MM-DD as a UTC date so that day arithmetic ignores time zones. */
export function parseIsoDate(iso: string): Date | null {
  const m = ISO_DATE.exec(iso)
  if (!m) return null
  const date = new Date(Date.UTC(Number(m[1]), Number(m[2]) - 1, Number(m[3])))
  return date.getUTCDate() === Number(m[3]) ? date : null
}

export function toIsoDate(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

/** Today in the visitor's time zone, as YYYY-MM-DD. */
export function todayIso(now = new Date()): string {
  return toIsoDate(now)
}

export function addDaysIso(iso: string, days: number): string {
  const date = parseIsoDate(iso)
  if (!date) return iso
  date.setUTCDate(date.getUTCDate() + days)
  return date.toISOString().slice(0, 10)
}

/** Number of nights between two YYYY-MM-DD dates (0 if invalid or not after). */
export function nightsBetween(checkIn: string, checkOut: string): number {
  const a = parseIsoDate(checkIn)
  const b = parseIsoDate(checkOut)
  if (!a || !b) return 0
  const nights = Math.round((b.getTime() - a.getTime()) / 86_400_000)
  return nights > 0 ? nights : 0
}

/** "2025-07-21" → "21 июля 2025 г." */
export function formatDate(
  iso: string,
  lang: Lang,
  options: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'long', year: 'numeric' },
): string {
  const date = parseIsoDate(iso)
  if (!date) return iso
  return new Intl.DateTimeFormat(LOCALES[lang], { ...options, timeZone: 'UTC' }).format(date)
}

/** "2025-07" → "July 2025" */
export function formatMonth(isoMonth: string, lang: Lang): string {
  const m = ISO_MONTH.exec(isoMonth)
  if (!m) return isoMonth
  const date = new Date(Date.UTC(Number(m[1]), Number(m[2]) - 1, 1))
  return new Intl.DateTimeFormat(LOCALES[lang], {
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(date)
}

/** "2025-07-21" → "21 Jul" — compact form for date ranges. */
export function formatShortDate(iso: string, lang: Lang): string {
  return formatDate(iso, lang, { day: 'numeric', month: 'short' })
}
