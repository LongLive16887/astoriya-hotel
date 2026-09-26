import type { BookingRequest } from '../content/types'
import { nightsBetween } from './format'

/** The site's form and the server (server/app.ts) check requests with the same rules. */
export const BOOKING_LIMITS = {
  name: 100,
  phone: 30,
  email: 120,
  message: 1000,
  roomName: 120,
  maxNights: 60,
  maxAdults: 10,
  maxChildren: 10,
} as const

export type BookingErrorCode =
  | 'required'
  | 'name'
  | 'phone'
  | 'email'
  | 'past'
  | 'order'
  | 'range'
  | 'guests'
  | 'capacity'
  | 'tooLong'

export type BookingErrors = Partial<Record<keyof BookingRequest, BookingErrorCode>>

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const PHONE_CHARS = /^\+?[\d\s()-]+$/

/**
 * Problems in a guest's request, by field. roomGuests is how many guests the chosen room sleeps
 * (adults and children together); without it, as for "any room", the number is not checked
 * against a room.
 */
export function validateBooking(b: BookingRequest, today: string, roomGuests?: number): BookingErrors {
  const errors: BookingErrors = {}
  const name = b.name.trim()
  const phone = b.phone.trim()
  const email = b.email.trim()

  if (!name) errors.name = 'required'
  else if (name.length < 2) errors.name = 'name'
  else if (name.length > BOOKING_LIMITS.name) errors.name = 'tooLong'

  const phoneDigits = phone.replace(/\D/g, '')
  if (!phone) errors.phone = 'required'
  else if (
    !PHONE_CHARS.test(phone) ||
    phoneDigits.length < 7 ||
    phoneDigits.length > 15 ||
    phone.length > BOOKING_LIMITS.phone
  )
    errors.phone = 'phone'

  if (email && (!EMAIL.test(email) || email.length > BOOKING_LIMITS.email)) errors.email = 'email'

  if (!b.checkIn) errors.checkIn = 'required'
  else if (b.checkIn < today) errors.checkIn = 'past'

  if (!b.checkOut) errors.checkOut = 'required'
  else if (b.checkIn && !errors.checkIn) {
    const nights = nightsBetween(b.checkIn, b.checkOut)
    if (nights < 1) errors.checkOut = 'order'
    else if (nights > BOOKING_LIMITS.maxNights) errors.checkOut = 'range'
  }

  if (!Number.isInteger(b.adults) || b.adults < 1 || b.adults > BOOKING_LIMITS.maxAdults)
    errors.adults = 'guests'
  if (!Number.isInteger(b.children) || b.children < 0 || b.children > BOOKING_LIMITS.maxChildren)
    errors.children = 'guests'
  else if (!errors.adults && roomGuests !== undefined && b.adults + b.children > roomGuests) errors.roomId = 'capacity'

  if (b.message.length > BOOKING_LIMITS.message) errors.message = 'tooLong'

  return errors
}

/** Trims text fields so that what is stored matches what the rules validate. */
export function cleanBooking(b: BookingRequest): BookingRequest {
  return {
    ...b,
    name: b.name.trim(),
    phone: b.phone.trim(),
    email: b.email.trim(),
    message: b.message.trim(),
    roomName: b.roomName.slice(0, BOOKING_LIMITS.roomName),
  }
}
