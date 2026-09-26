import { describe, expect, it } from 'vitest'
import type { BookingRequest } from '../content/types'
import { cleanBooking, validateBooking } from './booking'

const TODAY = '2026-09-24'

const valid: BookingRequest = {
  name: 'Anna Petrova',
  phone: '+998 90 123-45-67',
  email: '',
  checkIn: '2026-09-24',
  checkOut: '2026-09-26',
  adults: 2,
  children: 0,
  roomId: '',
  roomName: '',
  message: '',
  lang: 'ru',
}

const errorsFor = (patch: Partial<BookingRequest>) => validateBooking({ ...valid, ...patch }, TODAY)

describe('validateBooking', () => {
  it('accepts a complete request for today', () => {
    expect(validateBooking(valid, TODAY)).toEqual({})
  })

  it('requires a name and a phone', () => {
    expect(errorsFor({ name: '  ', phone: '' })).toMatchObject({ name: 'required', phone: 'required' })
    expect(errorsFor({ name: 'A' })).toMatchObject({ name: 'name' })
  })

  it.each(['12345', '+998 90 ABC 45 67', '1'.repeat(16)])('rejects the phone %s', (phone) => {
    expect(errorsFor({ phone }).phone).toBe('phone')
  })

  it('checks the email only when it is given', () => {
    expect(errorsFor({ email: 'anna@example' }).email).toBe('email')
    expect(errorsFor({ email: 'anna@example.com' }).email).toBeUndefined()
  })

  it('checks the dates', () => {
    expect(errorsFor({ checkIn: '', checkOut: '' })).toMatchObject({ checkIn: 'required', checkOut: 'required' })
    expect(errorsFor({ checkIn: '2026-09-23', checkOut: '2026-09-25' }).checkIn).toBe('past')
    expect(errorsFor({ checkOut: '2026-09-24' }).checkOut).toBe('order')
    expect(errorsFor({ checkOut: '2026-11-24' }).checkOut).toBe('range')
  })

  it('checks the number of guests', () => {
    expect(errorsFor({ adults: 0 }).adults).toBe('guests')
    expect(errorsFor({ adults: 11 }).adults).toBe('guests')
    expect(errorsFor({ children: -1 }).children).toBe('guests')
  })

  it('checks the guests against the chosen room', () => {
    const forRoom = (adults: number, children: number, roomGuests?: number) =>
      validateBooking({ ...valid, adults, children }, TODAY, roomGuests)
    expect(forRoom(4, 1, 2).roomId).toBe('capacity')
    expect(forRoom(2, 1, 2).roomId).toBe('capacity')
    expect(forRoom(2, 0, 2)).toEqual({})
    expect(forRoom(1, 1, 2)).toEqual({})
    // "Any room": the hotel picks rooms for the group.
    expect(forRoom(4, 1)).toEqual({})
    // A wrong number of guests is reported as such, not as a room that is too small.
    expect(forRoom(11, 0, 4)).toEqual({ adults: 'guests' })
  })

  it('limits the message length', () => {
    expect(errorsFor({ message: 'x'.repeat(1001) }).message).toBe('tooLong')
  })
})

describe('cleanBooking', () => {
  it('trims the text fields', () => {
    expect(cleanBooking({ ...valid, name: '  Anna  ', message: ' hi \n' })).toMatchObject({ name: 'Anna', message: 'hi' })
  })
})
