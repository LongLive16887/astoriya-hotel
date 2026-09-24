import { describe, expect, it } from 'vitest'
import { guestsLabel, internationalPhone, nightsLabel, plural, stayLabel } from './format'

describe('admin formatting', () => {
  it('declines Russian nouns', () => {
    expect(nightsLabel(1)).toBe('1 ночь')
    expect(nightsLabel(3)).toBe('3 ночи')
    expect(nightsLabel(5)).toBe('5 ночей')
    expect(nightsLabel(21)).toBe('21 ночь')
    expect(plural(12, 'гость', 'гостя', 'гостей')).toBe('12 гостей')
  })

  it('describes the guests', () => {
    expect(guestsLabel(2, 0)).toBe('2 взрослых')
    expect(guestsLabel(1, 3)).toBe('1 взрослый, 3 ребёнка')
    expect(guestsLabel(2, 5)).toBe('2 взрослых, 5 детей')
  })

  it('describes the stay', () => {
    expect(stayLabel({ checkIn: '2025-10-25', checkOut: '2025-10-27' })).toMatch(/^25 окт\.? → 27 окт\.? · 2 ночи$/)
    expect(stayLabel({ checkIn: '', checkOut: '' })).toBe('—')
  })

  it('turns local numbers into international ones', () => {
    expect(internationalPhone('90 123 45 67')).toBe('+998901234567')
    expect(internationalPhone('+7 (912) 000-00-00')).toBe('+79120000000')
    expect(internationalPhone('998901234567')).toBe('+998901234567')
  })
})
