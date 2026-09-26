export type Tile = 'full' | 'big' | 'wide' | 'normal'

/**
 * Tile sizes for the 4-column gallery so that the rows come out full:
 * the first photo is large and a few wide tiles pad the rest.
 */
export function desktopTiles(count: number): Tile[] {
  if (count === 1) return ['full']
  if (count === 2) return ['wide', 'wide']
  if (count === 3) return ['wide', 'normal', 'normal']
  if (count === 4) return ['normal', 'normal', 'normal', 'normal']
  const tiles: Tile[] = Array.from({ length: count }, () => 'normal')
  tiles[0] = 'big'
  // A big tile takes 4 cells, so count + 3 cells are used; pad up to a multiple of 4.
  const wides = (4 - ((count + 3) % 4)) % 4
  for (let k = 0; k < wides; k++) {
    tiles[count - 1 - Math.round((k * (count - 1)) / wides)] = 'wide'
  }
  return tiles
}

/** Same idea for the 2-column phone layout. */
export function mobileTiles(count: number): Tile[] {
  const tiles: Tile[] = Array.from({ length: count }, () => 'normal')
  if (count === 0) return tiles
  tiles[0] = 'wide'
  if ((count - 1) % 2 === 1) tiles[count - 1] = 'wide'
  return tiles
}
