/** Sections of the home page linked from the header and footer. */
export const NAV_SECTIONS = [
  { id: 'about', label: 'nav.about' },
  { id: 'rooms', label: 'nav.rooms' },
  { id: 'spa', label: 'nav.spa' },
  { id: 'gallery', label: 'nav.gallery' },
  { id: 'reviews', label: 'nav.reviews' },
  { id: 'contacts', label: 'nav.contacts' },
] as const

export const sectionLink = (id: string) => ({ pathname: '/', hash: `#${id}` })
