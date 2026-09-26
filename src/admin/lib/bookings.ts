import { useEffect, useRef } from 'react'
import { isLang } from '../../content/localized'
import { BOOKING_STATUSES, type BookingRequest, type BookingStatus } from '../../content/types'
import { api } from '../../lib/api'
import { subscribe, useLiveQuery } from './live'

export const STATUS_LABELS: Record<BookingStatus, string> = {
  new: 'Новая',
  confirmed: 'Подтверждена',
  completed: 'Завершена',
  cancelled: 'Отменена',
}

export interface Booking extends BookingRequest {
  id: string
  status: BookingStatus
  note: string
  createdAt: Date | null
  updatedAt: Date | null
}

const str = (v: unknown) => (typeof v === 'string' ? v : '')
const int = (v: unknown, fallback: number) => (typeof v === 'number' && Number.isFinite(v) ? v : fallback)
const date = (v: unknown) => (typeof v === 'number' && Number.isFinite(v) ? new Date(v) : null)

/** A request as the API returns it (times in milliseconds). */
export function toBooking(raw: unknown): Booking {
  const data = (typeof raw === 'object' && raw !== null ? raw : {}) as Record<string, unknown>
  return {
    id: str(data.id),
    status: BOOKING_STATUSES.find((s) => s === data.status) ?? 'new',
    name: str(data.name),
    phone: str(data.phone),
    email: str(data.email),
    checkIn: str(data.checkIn),
    checkOut: str(data.checkOut),
    adults: int(data.adults, 1),
    children: int(data.children, 0),
    roomId: str(data.roomId),
    roomName: str(data.roomName),
    message: str(data.message),
    lang: isLang(data.lang) ? data.lang : 'ru',
    note: str(data.note),
    createdAt: date(data.createdAt),
    updatedAt: date(data.updatedAt),
  }
}

interface BookingsState {
  bookings: Booking[]
  loading: boolean
  error: string | null
}

const parseList = (json: unknown) => ((json as { bookings?: unknown[] }).bookings ?? []).map(toBooking)

function useBookingList(query: string): BookingsState {
  const { data, loading, error } = useLiveQuery(`/api/admin/bookings?${query}`, 'bookings', parseList)
  return { bookings: data ?? [], loading, error }
}

/** The latest `max` booking requests, updated live. */
export const useBookings = (max: number) => useBookingList(`limit=${max}`)

/** Requests received since `since` (a timestamp in ms), updated live. */
export const useBookingsSince = (since: number) => useBookingList(`since=${since}&limit=1000`)

/** Requests with check-in between two ISO dates (inclusive), whatever their status, updated live. */
export const useArrivals = (from: string, to: string) => useBookingList(`checkInFrom=${from}&checkInTo=${to}&limit=500`)

/** One request by id, updated live; null while loading, when missing, or when `id` is null. */
export function useBooking(id: string | null): Booking | null {
  const { data } = useLiveQuery(id ? `/api/admin/bookings/${encodeURIComponent(id)}` : null, 'bookings', toBooking)
  return data ?? null
}

/** Live list of requests that nobody has handled yet; `onAdded` fires for requests arriving later. */
export function useNewBookings(onAdded?: (booking: Booking) => void): Booking[] {
  const { bookings } = useBookingList('status=new&limit=500')
  const onAddedRef = useRef(onAdded)

  useEffect(() => {
    onAddedRef.current = onAdded
  }, [onAdded])

  // Only requests sent by guests are announced (not ones an admin moved back to "new").
  useEffect(() => subscribe('booking-created', (raw) => onAddedRef.current?.(toBooking(raw))), [])

  return bookings
}

export async function updateBooking(id: string, patch: Partial<Pick<Booking, 'status' | 'note'>>) {
  await api(`/api/admin/bookings/${encodeURIComponent(id)}`, { method: 'PATCH', json: patch })
}

export async function deleteBooking(id: string) {
  await api(`/api/admin/bookings/${encodeURIComponent(id)}`, { method: 'DELETE' })
}

const CSV_COLUMNS: [string, (b: Booking) => string | number][] = [
  ['Получена', (b) => (b.createdAt ? b.createdAt.toLocaleString('ru-RU') : '')],
  ['Статус', (b) => STATUS_LABELS[b.status]],
  ['Имя', (b) => b.name],
  ['Телефон', (b) => b.phone],
  ['Email', (b) => b.email],
  ['Заезд', (b) => b.checkIn],
  ['Выезд', (b) => b.checkOut],
  ['Взрослые', (b) => b.adults],
  ['Дети', (b) => b.children],
  ['Номер', (b) => b.roomName],
  ['Пожелания', (b) => b.message],
  ['Заметка', (b) => b.note],
  ['Язык', (b) => b.lang],
]

/**
 * CSV that opens correctly in Excel (BOM, semicolons, quoted cells). Guests type the values,
 * so text that Excel would treat as a formula (=, +, -, @) is prefixed with an apostrophe.
 */
export function bookingsToCsv(bookings: Booking[]): string {
  const cell = (value: string | number) => {
    const text = typeof value === 'string' && /^[=+\-@\t\r]/.test(value) ? `'${value}` : String(value)
    return `"${text.replace(/"/g, '""')}"`
  }
  const rows = [
    CSV_COLUMNS.map(([title]) => cell(title)).join(';'),
    ...bookings.map((b) => CSV_COLUMNS.map(([, get]) => cell(get(b))).join(';')),
  ]
  return '\ufeff' + rows.join('\r\n')
}
