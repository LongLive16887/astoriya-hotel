import { describe, expect, it } from 'vitest'
import { addDaysIso, formatDate, formatUsd, formatUzs, nightsBetween, parseIsoDate } from './format'

// Intl separates thousands with (narrow) no-break spaces; compare with plain spaces.
const plain = (s: string) => s.replace(/[\u00a0\u202f]/g, ' ')

describe('dates', () => {
  it('parses only real calendar dates', () => {
    expect(parseIsoDate('2024-02-29')).not.toBeNull()
    expect(parseIsoDate('2025-02-29')).toBeNull()
    expect(parseIsoDate('21.07.2025')).toBeNull()
  })

  it('adds days across month and year boundaries', () => {
    expect(addDaysIso('2025-12-31', 1)).toBe('2026-01-01')
    expect(addDaysIso('2024-02-28', 1)).toBe('2024-02-29')
    expect(addDaysIso('2025-03-01', -1)).toBe('2025-02-28')
  })

  it('counts nights', () => {
    expect(nightsBetween('2025-10-25', '2025-10-27')).toBe(2)
    expect(nightsBetween('2025-10-27', '2025-10-25')).toBe(0)
    expect(nightsBetween('', '2025-10-25')).toBe(0)
  })

  it('formats dates for each language', () => {
    expect(formatDate('2025-07-21', 'en')).toBe('21 July 2025')
    expect(formatDate('2025-07-21', 'ru')).toMatch(/^21 июля 2025/)
  })
})

describe('prices', () => {
  it('formats sums with the local currency name', () => {
    expect(plain(formatUzs(1_700_000, 'ru'))).toBe('1 700 000 сум')
    expect(plain(formatUzs(1_700_000, 'en'))).toBe('1,700,000 UZS')
    expect(plain(formatUzs(1_700_000, 'uz'))).toMatch(/^1 700 000 soʻm$/)
  })

  it('formats dollars without cents', () => {
    expect(formatUsd(130)).toBe('$130')
  })
})
