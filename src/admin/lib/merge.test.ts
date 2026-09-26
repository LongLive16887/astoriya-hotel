import { describe, expect, it } from 'vitest'
import { mergeEdits } from './merge'

describe('mergeEdits', () => {
  const base = {
    phone: '+998 66 000 00 00',
    hero: { title: { uz: 'A', ru: 'Б', en: 'C' }, image: '/a.webp' },
    highlights: [{ value: '1' }, { value: '2' }],
  }

  it('keeps changes made meanwhile to fields that were not edited', () => {
    const current = { ...base, phone: '+998 66 111 11 11', hero: { ...base.hero, image: '/b.webp' } }
    const draft = { ...base, hero: { ...base.hero, title: { ...base.hero.title, ru: 'Новый' } } }
    expect(mergeEdits(current, base, draft)).toEqual({
      phone: '+998 66 111 11 11',
      hero: { title: { uz: 'A', ru: 'Новый', en: 'C' }, image: '/b.webp' },
      highlights: base.highlights,
    })
  })

  it('lets the edit win when both sides changed the same value', () => {
    const current = { ...base, phone: 'theirs' }
    const draft = { ...base, phone: 'mine' }
    expect(mergeEdits(current, base, draft).phone).toBe('mine')
  })

  it('replaces arrays as a whole', () => {
    const current = { ...base, highlights: [{ value: '1' }, { value: '2' }, { value: '3' }] }
    const draft = { ...base, highlights: [{ value: '2' }, { value: '1' }] }
    expect(mergeEdits(current, base, draft).highlights).toEqual([{ value: '2' }, { value: '1' }])
    expect(mergeEdits(current, base, base).highlights).toEqual(current.highlights)
  })

  it('returns the stored version when nothing was edited', () => {
    const current = { ...base, phone: 'theirs' }
    expect(mergeEdits(current, base, structuredClone(base))).toEqual(current)
  })
})
