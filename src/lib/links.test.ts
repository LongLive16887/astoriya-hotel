import { describe, expect, it } from 'vitest'
import { uniqueId, slugify } from './ids'
import { handleLabel, instagramHref, normalizePhone, safeHref, safeMapEmbed, telegramHref, telHref, whatsappHref } from './links'

describe('links', () => {
  it('builds phone links', () => {
    expect(normalizePhone(' +998 (55) 705-00-10 ')).toBe('+998557050010')
    expect(telHref('+998 55 705 00 10')).toBe('tel:+998557050010')
    expect(whatsappHref('+998 90 123 45 67', 'Привет')).toBe('https://wa.me/998901234567?text=%D0%9F%D1%80%D0%B8%D0%B2%D0%B5%D1%82')
  })

  it('accepts social handles with @ or as full links', () => {
    expect(telegramHref('@astoria_boutique_hotel')).toBe('https://t.me/astoria_boutique_hotel')
    expect(telegramHref('https://t.me/astoria_boutique_hotel')).toBe('https://t.me/astoria_boutique_hotel')
    expect(instagramHref('https://www.instagram.com/astoria/')).toBe('https://www.instagram.com/astoria/')
    expect(handleLabel('astoria')).toBe('@astoria')
  })

  it('blocks script links', () => {
    expect(safeHref('javascript:alert(1)')).toBe('#')
    expect(safeHref('https://maps.app.goo.gl/x')).toBe('https://maps.app.goo.gl/x')
    expect(safeHref('/rooms/a')).toBe('/rooms/a')
  })

  it('allows only Google Maps embeds in the map frame', () => {
    expect(safeMapEmbed('https://www.google.com/maps/embed?pb=1')).toBe('https://www.google.com/maps/embed?pb=1')
    expect(safeMapEmbed('https://evil.example/maps/embed')).toBeNull()
    expect(safeMapEmbed('https://www.google.ru/maps/embed?pb=1')).toBe('https://www.google.ru/maps/embed?pb=1')
    expect(safeMapEmbed('https://google.evil.com/maps/embed')).toBeNull()
    expect(safeMapEmbed('https://www.google.com.attacker.io/maps/embed')).toBeNull()
    expect(safeMapEmbed('https://www.google.com@evil.com/maps/embed')).toBeNull()
    expect(safeMapEmbed('http://www.google.com/maps/embed?pb=1')).toBeNull()
    expect(safeMapEmbed('https://www.google.com/search?q=maps/embed')).toBeNull()
    expect(safeMapEmbed('not a url')).toBeNull()
  })
})

describe('ids', () => {
  it('turns titles in any site language into URL slugs', () => {
    expect(slugify('Семейный номер')).toBe('semeynyy-nomer')
    expect(slugify('Oʻzbek xona №1')).toBe('ozbek-xona-no1')
    expect(slugify('Double Deluxe!')).toBe('double-deluxe')
  })

  it('avoids taken ids', () => {
    expect(uniqueId('Family Room', ['family-room', 'family-room-2'])).toBe('family-room-3')
    expect(uniqueId('New', [])).toBe('new')
    expect(uniqueId('!!!', [])).toMatch(/^[a-z0-9]{6}$/)
  })
})
