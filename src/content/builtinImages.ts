/** Photos shipped with the site (public/images); offered in the admin image library. */
export const BUILTIN_IMAGES = [
  '/images/facade.webp',
  '/images/rooftop.webp',
  '/images/terrace.webp',
  '/images/pool.webp',
  '/images/room-double.webp',
  '/images/room-triple.webp',
  '/images/room-family-bedroom.webp',
  '/images/room-family-lounge.webp',
  '/images/room-twin.webp',
]

/** Built-in photos that also exist as 640px-wide copies (name-640.webp) for phones. */
const SMALL_COPIES = new Set([
  '/images/room-double.webp',
  '/images/room-family-bedroom.webp',
  '/images/room-triple.webp',
  '/images/room-twin.webp',
])

export function builtinSrcSet(src: string): string | undefined {
  return SMALL_COPIES.has(src) ? `${src.replace(/\.webp$/, '-640.webp')} 640w, ${src} 1024w` : undefined
}
