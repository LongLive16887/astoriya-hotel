import { useEffect, useRef, useState } from 'react'
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

/** The latest `max` booking requests, updated live. */
export function useBookings(max: number): BookingsState {
  const [state, setState] = useState<BookingsState>({ bookings: [], loading: true, error: null })

  useEffect(
    () =>
      onSnapshot(
        query(collection(getDb(), 'bookings'), orderBy('createdAt', 'desc'), limit(max)),
        (snapshot) =>
          setState({
            bookings: snapshot.docs.map((d) => toBooking(d.id, d.data())),
            loading: false,
            error: null,
          }),
        (error) => setState((s) => ({ ...s, loading: false, error: error.message })),
      ),
    [max],
  )

  return state
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
            .filter((change) => change.type === 'added')
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
