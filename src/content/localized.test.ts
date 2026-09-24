import { describe, expect, it } from 'vitest'
import { glueDashes, isLang, paragraphs, tr } from './localized'

describe('tr', () => {
  it('returns the requested language', () => {
    expect(tr({ uz: 'Salom', ru: 'Привет', en: 'Hello' }, 'uz')).toBe('Salom')
  })

  it('falls back when a translation is empty', () => {
    expect(tr({ uz: '', ru: 'Привет', en: 'Hello' }, 'uz')).toBe('Привет')
    expect(tr({ uz: 'Salom', ru: '  ', en: '' }, 'ru')).toBe('Salom')
    expect(tr({ uz: '', ru: 'Привет', en: '' }, 'en')).toBe('Привет')
  })

  it('handles missing values', () => {
    expect(tr(undefined, 'ru')).toBe('')
    expect(tr({ ru: '' }, 'ru')).toBe('')
  })

  it('keeps dashes on the line of the previous word', () => {
    expect(tr({ ru: 'Чистота — наш приоритет' }, 'ru')).toBe('Чистота\u00a0— наш приоритет')
  })
})

describe('glueDashes', () => {
  it('replaces the space before em and en dashes only', () => {
    expect(glueDashes('a — b – c - d')).toBe('a\u00a0— b\u00a0– c - d')
  })
})

describe('paragraphs', () => {
  it('splits on blank lines and trims', () => {
    expect(paragraphs('One\nstill one\n\n  Two  \n \n\nThree')).toEqual(['One\nstill one', 'Two', 'Three'])
    expect(paragraphs('')).toEqual([])
  })
})

describe('isLang', () => {
  it('accepts only site languages', () => {
    expect(isLang('uz')).toBe(true)
    expect(isLang('de')).toBe(false)
    expect(isLang(undefined)).toBe(false)
  })
})
