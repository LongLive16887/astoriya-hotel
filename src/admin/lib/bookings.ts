import { useEffect, useMemo, useRef, useState } from 'react'
import {
  collection,
  deleteDoc,
  doc,
  limit,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  Timestamp,
  updateDoc,
  where,
  type Query,
} from 'firebase/firestore'
import { isLang } from '../../content/localized'
import { BOOKING_STATUSES, type BookingRequest, type BookingStatus } from '../../content/types'
import { currentEditor, getDb } from './firebase'

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
const date = (v: unknown) => (v instanceof Timestamp ? v.toDate() : null)

export function toBooking(id: string, data: Record<string, unknown>): Booking {
  const status = BOOKING_STATUSES.find((s) => s === data.status) ?? 'new'
  return {
    id,
    status,
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

const bookingsRef = () => collection(getDb(), 'bookings')

function useBookingsQuery(bookingsQuery: Query): BookingsState {
  const [state, setState] = useState<BookingsState>({ bookings: [], loading: true, error: null })

  useEffect(
    () =>
      onSnapshot(
        bookingsQuery,
        (snapshot) =>
          setState({
            bookings: snapshot.docs.map((d) => toBooking(d.id, d.data())),
            loading: false,
            error: null,
          }),
        (error) => setState((s) => ({ ...s, loading: false, error: error.message })),
      ),
    [bookingsQuery],
  )

  return state
}

/** The latest `max` booking requests, updated live. */
export function useBookings(max: number): BookingsState {
  return useBookingsQuery(useMemo(() => query(bookingsRef(), orderBy('createdAt', 'desc'), limit(max)), [max]))
}

/** Requests received since `since` (a timestamp in ms), updated live. */
export function useBookingsSince(since: number): BookingsState {
  return useBookingsQuery(useMemo(() => query(bookingsRef(), where('createdAt', '>=', Timestamp.fromMillis(since))), [since]))
}

/** Requests with check-in between two ISO dates (inclusive), whatever their status, updated live. */
export function useArrivals(from: string, to: string): BookingsState {
  return useBookingsQuery(
    useMemo(() => query(bookingsRef(), where('checkIn', '>=', from), where('checkIn', '<=', to), orderBy('checkIn')), [from, to]),
  )
}

/** One request by id, updated live; null while loading, when missing, or when `id` is null. */
export function useBooking(id: string | null): Booking | null {
  const [booking, setBooking] = useState<Booking | null>(null)

  useEffect(() => {
    if (!id) return
    return onSnapshot(
      doc(getDb(), 'bookings', id),
      (snapshot) => setBooking(snapshot.exists() ? toBooking(snapshot.id, snapshot.data()) : null),
      () => setBooking(null),
    )
  }, [id])

  return booking && booking.id === id ? booking : null
}

/** Live list of requests that nobody has handled yet; `onAdded` fires for requests arriving later. */
export function useNewBookings(onAdded?: (booking: Booking) => void): Booking[] {
  const [bookings, setBookings] = useState<Booking[]>([])
  const onAddedRef = useRef(onAdded)

  useEffect(() => {
    onAddedRef.current = onAdded
  }, [onAdded])

  useEffect(() => {
    let initial = true
    return onSnapshot(
      query(collection(getDb(), 'bookings'), where('status', '==', 'new')),
      (snapshot) => {
        setBookings(snapshot.docs.map((d) => toBooking(d.id, d.data())))
        if (!initial) {
          snapshot
            .docChanges()
            // Guests cannot set updatedAt, so a request that has it was moved back to "new" by an admin.
            .filter((change) => change.type === 'added' && !('updatedAt' in change.doc.data()))
            .forEach((change) => onAddedRef.current?.(toBooking(change.doc.id, change.doc.data())))
        }
        initial = false
      },
      () => setBookings([]),
    )
  }, [])

  return bookings
}

export async function updateBooking(id: string, patch: Partial<Pick<Booking, 'status' | 'note'>>) {
  await updateDoc(doc(getDb(), 'bookings', id), {
    ...patch,
    updatedAt: serverTimestamp(),
    updatedBy: currentEditor(),
  })
}

export async function deleteBooking(id: string) {
  await deleteDoc(doc(getDb(), 'bookings', id))
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
