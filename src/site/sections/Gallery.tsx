import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Expand } from 'lucide-react'
import { Img } from '../../components/Img'
import { Lightbox } from '../../components/Lightbox'
import { useContent } from '../../content/context'
import { tr } from '../../content/localized'
import { GALLERY_CATEGORIES, type GalleryCategory } from '../../content/types'
import { useLang } from '../../i18n/useLang'
import { desktopTiles, mobileTiles } from './mosaic'
import { SectionHeading } from './SectionHeading'
import './Gallery.css'

const INITIAL_COUNT = 9

export function Gallery() {
  const { t } = useTranslation()
  const lang = useLang()
  const { gallery } = useContent()
  const [filter, setFilter] = useState<GalleryCategory | 'all'>('all')
  const [expanded, setExpanded] = useState(false)
  const [openIndex, setOpenIndex] = useState<number | null>(null)

  if (gallery.length === 0) return null

  const categories = GALLERY_CATEGORIES.filter((c) => gallery.some((g) => g.category === c))
  const items = filter === 'all' ? gallery : gallery.filter((g) => g.category === filter)
  const shown = expanded ? items : items.slice(0, INITIAL_COUNT)
  const lightboxImages = items.map((g) => ({ src: g.src, caption: tr(g.caption, lang) }))
  const tiles = desktopTiles(shown.length)
  const tilesSm = mobileTiles(shown.length)

  return (
    <section id="gallery" className="section gallery" aria-labelledby="gallery-title">
      <div className="container">
        <div className="section-row">
          <SectionHeading id="gallery-title" eyebrow={t('gallery.eyebrow')} title={t('gallery.title')} />
          {categories.length > 1 && (
            <div className="gallery__filters reveal" role="group" aria-label={t('gallery.eyebrow')}>
              {(['all', ...categories] as const).map((c) => (
                <button
                  key={c}
                  type="button"
                  className="chip"
                  aria-pressed={filter === c}
                  onClick={() => {
                    setFilter(c)
                    setExpanded(false)
                  }}
                >
                  {c === 'all' ? t('gallery.all') : t(`gallery.categories.${c}`)}
                </button>
              ))}
            </div>
          )}
        </div>

        <ul className="gallery__grid">
          {shown.map((image, i) => {
            const caption = tr(image.caption, lang)
            return (
              <li key={image.id} className="gallery__item reveal" data-tile={tiles[i]} data-tile-sm={tilesSm[i]}>
                <button
                  type="button"
                  className="gallery__button"
                  onClick={() => setOpenIndex(i)}
                  aria-label={t('a11y.openPhoto', { caption: caption || String(i + 1) })}
                >
                  <Img src={image.src} alt="" />
                  <span className="gallery__overlay" aria-hidden="true">
                    {caption && <span className="gallery__caption">{caption}</span>}
                    <Expand size={18} />
                  </span>
                </button>
              </li>
            )
          })}
        </ul>

        {!expanded && items.length > INITIAL_COUNT && (
          <div className="gallery__more">
            <button type="button" className="btn btn--outline" onClick={() => setExpanded(true)}>
              {t('actions.showMore')} · {items.length - INITIAL_COUNT}
            </button>
          </div>
        )}
      </div>
      <Lightbox images={lightboxImages} index={openIndex} onChange={setOpenIndex} />
    </section>
  )
}
