import { describe, expect, it } from 'vitest'
import { DEFAULT_CONTENT } from './defaults'
import { normalizeContent, normalizeGalleryImage, normalizePost, normalizeReview, normalizeRoom, normalizeSettings } from './normalize'

describe('normalizeContent', () => {
  it('uses the defaults for documents that were never saved', () => {
    expect(normalizeContent({}, DEFAULT_CONTENT)).toEqual(DEFAULT_CONTENT)
  })

  it('uses saved documents, even empty lists', () => {
    const content = normalizeContent({ rooms: { items: [] }, reviews: {} }, DEFAULT_CONTENT)
    expect(content.rooms).toEqual([])
    expect(content.reviews).toEqual([])
    expect(content.services).toBe(DEFAULT_CONTENT.services)
  })

  it('drops broken and duplicate items', () => {
    const content = normalizeContent(
      {
        services: {
          items: [
            { id: 'a', icon: 'wifi', title: { ru: 'Wi-Fi' } },
            { id: 'a', icon: 'waves' },
            { title: { ru: 'без id' } },
            'garbage',
            { id: 'b', icon: 'unknown-icon' },
          ],
        },
      },
      DEFAULT_CONTENT,
    )
    expect(content.services.map((s) => s.id)).toEqual(['a', 'b'])
    expect(content.services[0].title).toEqual({ uz: '', ru: 'Wi-Fi', en: '' })
    expect(content.services[1].icon).toBe('sparkles')
  })
})

describe('normalizeSettings', () => {
  it('fills missing fields from the defaults but keeps stored empty strings', () => {
    const settings = normalizeSettings({ phone: '+998 90 000 00 00', email: '', hero: { title: { ru: 'Заголовок' } } }, DEFAULT_CONTENT.settings)
    expect(settings.phone).toBe('+998 90 000 00 00')
    expect(settings.email).toBe('')
    expect(settings.telegram).toBe(DEFAULT_CONTENT.settings.telegram)
    expect(settings.hero.title.ru).toBe('Заголовок')
    expect(settings.hero.title.en).toBe(DEFAULT_CONTENT.settings.hero.title.en)
    expect(settings.hero.image).toBe(DEFAULT_CONTENT.settings.hero.image)
  })

  it('ignores values of the wrong type', () => {
    const settings = normalizeSettings({ phone: 42, location: { lat: 'x', lng: 66.9 }, highlights: 'nope' }, DEFAULT_CONTENT.settings)
    expect(settings.phone).toBe(DEFAULT_CONTENT.settings.phone)
    expect(settings.location).toEqual({ lat: DEFAULT_CONTENT.settings.location.lat, lng: 66.9 })
    expect(settings.highlights).toBe(DEFAULT_CONTENT.settings.highlights)
  })
})

describe('item normalizers', () => {
  it('keeps only known amenities and string images for rooms', () => {
    const room = normalizeRoom({ id: 'r', amenities: ['wifi', 'jacuzzi', 5], images: ['/a.webp', '', null], priceUzs: '100' })
    expect(room?.amenities).toEqual(['wifi'])
    expect(room?.images).toEqual(['/a.webp'])
    expect(room?.priceUzs).toBe(0)
    expect(room?.visible).toBe(true)
  })

  it('requires a source for gallery images', () => {
    expect(normalizeGalleryImage({ id: 'g' })).toBeNull()
    expect(normalizeGalleryImage({ id: 'g', src: '/x.webp', category: 'nope' })?.category).toBe('other')
  })

  it('clamps review ratings', () => {
    expect(normalizeReview({ id: 'x', rating: 7 })?.rating).toBe(0)
    expect(normalizeReview({ id: 'x', rating: 4.6 })?.rating).toBe(5)
  })

  it('treats posts as drafts unless published is true', () => {
    expect(normalizePost('p', { published: 'yes' }).published).toBe(false)
    expect(normalizePost('p', { published: true, date: '2025-07-21' })).toMatchObject({ id: 'p', published: true, date: '2025-07-21' })
  })
})
