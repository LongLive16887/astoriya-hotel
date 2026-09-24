import { isLang } from '../src/content/localized'
import { BOOKING_STATUSES, type BookingRequest, type BookingStatus } from '../src/content/types'
import { randomId } from '../src/lib/ids'
import type { Db } from './db'

export interface Booking extends BookingRequest {
  id: string
  status: BookingStatus
  /** Staff notes, never shown to the guest. */
  note: string
  createdAt: number
  updatedAt: number | null
  updatedBy: string | null
}

interface Row {
  id: string
  status: string
  name: string
  phone: string
  email: string
  check_in: string
  check_out: string
  adults: number
  children: number
  room_id: string
  room_name: string
  message: string
  lang: string
  note: string
  created_at: number
  updated_at: number | null
  updated_by: string | null
}

const COLUMNS =
  'id, status, name, phone, email, check_in, check_out, adults, children, room_id, room_name, message, lang, note, created_at, updated_at, updated_by'

export const isBookingStatus = (value: unknown): value is BookingStatus => BOOKING_STATUSES.includes(value as BookingStatus)

const toBooking = (r: Row): Booking => ({
  id: r.id,
  status: isBookingStatus(r.status) ? r.status : 'new',
  name: r.name,
  phone: r.phone,
  email: r.email,
  checkIn: r.check_in,
  checkOut: r.check_out,
  adults: r.adults,
  children: r.children,
  roomId: r.room_id,
  roomName: r.room_name,
  message: r.message,
  lang: isLang(r.lang) ? r.lang : 'ru',
  note: r.note,
  createdAt: r.created_at,
  updatedAt: r.updated_at,
  updatedBy: r.updated_by,
})

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/

/** The guest's request from a JSON body, or null when a field is missing or has the wrong type. */
export function parseBookingRequest(body: unknown): BookingRequest | null {
  if (typeof body !== 'object' || body === null) return null
  const b = body as Record<string, unknown>
  const text = (key: string, required = false) =>
    typeof b[key] === 'string' ? (b[key] as string) : !required && b[key] === undefined ? '' : null
  const request = {
    name: text('name', true),
    phone: text('phone', true),
    email: text('email'),
    checkIn: text('checkIn', true),
    checkOut: text('checkOut', true),
    adults: b.adults,
    children: b.children ?? 0,
    roomId: text('roomId'),
    roomName: '',
    message: text('message'),
    lang: b.lang,
  }
  const { name, phone, email, checkIn, checkOut, adults, children, roomId, message, lang } = request
  if (name === null || phone === null || email === null || roomId === null || message === null) return null
  if (checkIn === null || checkOut === null || !ISO_DATE.test(checkIn) || !ISO_DATE.test(checkOut)) return null
  if (typeof adults !== 'number' || typeof children !== 'number' || !isLang(lang)) return null
  return { name, phone, email, checkIn, checkOut, adults, children, roomId: roomId.slice(0, 80), roomName: '', message, lang }
}

export function createBooking(db: Db, request: BookingRequest, now: number): Booking {
  const id = randomId(16)
  db.prepare(
    `INSERT INTO bookings (id, status, name, phone, email, check_in, check_out, adults, children,
       room_id, room_name, message, lang, created_at)
     VALUES (?, 'new', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
  ).run(
    id,
    request.name,
    request.phone,
    request.email,
    request.checkIn,
    request.checkOut,
    request.adults,
    request.children,
    request.roomId,
    request.roomName,
    request.message,
    request.lang,
    now,
  )
  return getBooking(db, id)!
}

export function getBooking(db: Db, id: string): Booking | null {
  const row = db.prepare(`SELECT ${COLUMNS} FROM bookings WHERE id = ?`).get(id) as Row | undefined
  return row ? toBooking(row) : null
}

export interface BookingFilter {
  status?: BookingStatus
  /** Received at or after this time (ms). */
  since?: number
  /** Check-in between these ISO dates, inclusive; the list is then ordered by check-in. */
  checkInFrom?: string
  checkInTo?: string
  limit: number
}

export function listBookings(db: Db, filter: BookingFilter): Booking[] {
  const conditions: [string, string | number | undefined][] = [
    ['status = ?', filter.status],
    ['created_at >= ?', filter.since],
    ['check_in >= ?', filter.checkInFrom],
    ['check_in <= ?', filter.checkInTo],
  ]
  const used = conditions.filter(([, value]) => value !== undefined && value !== '')
  const where = used.map(([sql]) => sql)
  const params = used.map(([, value]) => value as string | number)
  const byCheckIn = Boolean(filter.checkInFrom || filter.checkInTo)
  const rows = db
    .prepare(
      `SELECT ${COLUMNS} FROM bookings ${where.length ? `WHERE ${where.join(' AND ')}` : ''}
       ORDER BY ${byCheckIn ? 'check_in, created_at' : 'created_at DESC'} LIMIT ?`,
    )
    .all(...params, filter.limit) as unknown as Row[]
  return rows.map(toBooking)
}

export function updateBooking(
  db: Db,
  id: string,
  patch: { status?: BookingStatus; note?: string },
  editor: string,
  now: number,
): Booking | null {
  const current = getBooking(db, id)
  if (!current) return null
  db.prepare('UPDATE bookings SET status = ?, note = ?, updated_at = ?, updated_by = ? WHERE id = ?').run(
    patch.status ?? current.status,
    patch.note ?? current.note,
    now,
    editor,
    id,
  )
  return getBooking(db, id)
}

export function deleteBooking(db: Db, id: string): boolean {
  return Number(db.prepare('DELETE FROM bookings WHERE id = ?').run(id).changes) > 0
}
