import { useContent } from '../../content/context'
import { tr } from '../../content/localized'
import type { Lang, Review } from '../../content/types'
import { useLang } from '../../i18n/useLang'

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

/** Reviews the home page shows: the section disappears when there are none. */
export const shownReviews = (reviews: Review[], lang: Lang) => reviews.filter((r) => r.visible && tr(r.text, lang))

/** NAV_SECTIONS without the gallery and reviews while they have nothing to show. */
export function useNavSections() {
  const { gallery, reviews } = useContent()
  const lang = useLang()
  return NAV_SECTIONS.filter(
    (item) =>
      (item.id !== 'gallery' || gallery.length > 0) && (item.id !== 'reviews' || shownReviews(reviews, lang).length > 0),
  )
}
