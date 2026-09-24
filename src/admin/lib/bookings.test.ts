import { describe, expect, it } from 'vitest'
import { bookingsToCsv, toBooking } from './bookings'

describe('bookingsToCsv', () => {
  const booking = toBooking('b1', {
    name: '=HYPERLINK("http://evil")',
    phone: '+998 90 123 45 67',
    status: 'confirmed',
    checkIn: '2026-10-01',
    checkOut: '2026-10-03',
    adults: 2,
    children: 0,
    message: 'Say "hi"; thanks',
  })

  it('starts with a BOM and a header row', () => {
    const csv = bookingsToCsv([booking])
    expect(csv.startsWith('﻿"Получена";"Статус";"Имя"')).toBe(true)
  })

  it('neutralises formulas and escapes quotes', () => {
    const row = bookingsToCsv([booking]).split('\r\n')[1]
    expect(row).toContain(`"'=HYPERLINK(""http://evil"")"`)
    expect(row).toContain(`"'+998 90 123 45 67"`)
    expect(row).toContain('"Say ""hi""; thanks"')
    expect(row).toContain('"Подтверждена"')
  })
})

describe('toBooking', () => {
  it('fills defaults for broken documents', () => {
    expect(toBooking('x', { status: 'weird', adults: 'two' })).toMatchObject({ id: 'x', status: 'new', adults: 1, lang: 'ru', createdAt: null })
  })
})
