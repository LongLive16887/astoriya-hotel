import { describe, expect, it } from 'vitest'
import { desktopTiles, mobileTiles, type Tile } from './mosaic'

const DESKTOP_CELLS: Record<Tile, number> = { full: 8, big: 4, wide: 2, normal: 1 }
const MOBILE_CELLS: Record<Tile, number> = { full: 2, big: 2, wide: 2, normal: 1 }

describe('gallery mosaic', () => {
  it.each(Array.from({ length: 20 }, (_, i) => i + 1))('fills complete rows on desktop for %i photos', (count) => {
    const tiles = desktopTiles(count)
    expect(tiles).toHaveLength(count)
    const cells = tiles.reduce((sum, tile) => sum + DESKTOP_CELLS[tile], 0)
    expect(cells % 4).toBe(0)
  })

  it.each(Array.from({ length: 20 }, (_, i) => i + 1))('fills complete rows on phones for %i photos', (count) => {
    const cells = mobileTiles(count).reduce((sum, tile) => sum + MOBILE_CELLS[tile], 0)
    expect(cells % 2).toBe(0)
  })
})
