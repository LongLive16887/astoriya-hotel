import { useEffect, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { ChevronLeft, ChevronRight, X } from 'lucide-react'
import { Dialog } from './Dialog'
import './Lightbox.css'

export interface LightboxImage {
  src: string
  caption?: string
}

interface LightboxProps {
  images: LightboxImage[]
  /** Index of the open image, or null when closed. */
  index: number | null
  onChange: (index: number | null) => void
}

export function Lightbox({ images, index, onChange }: LightboxProps) {
  const { t } = useTranslation()
  const touchStart = useRef<number | null>(null)
  const open = index !== null && images.length > 0
  const current = open ? images[Math.min(index, images.length - 1)] : null
  const count = images.length

  const go = (delta: number) => {
    if (index === null) return
    onChange((index + delta + count) % count)
  }

  useEffect(() => {
    if (!open) return
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'ArrowLeft') onChange(((index ?? 0) - 1 + count) % count)
      if (event.key === 'ArrowRight') onChange(((index ?? 0) + 1) % count)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, index, count, onChange])

  return (
    <Dialog open={open} onClose={() => onChange(null)} label={current?.caption || t('a11y.photo', { n: (index ?? 0) + 1, total: count })} className="lightbox">
      {current && index !== null && (
        <div
          className="lightbox__stage"
          onClick={(event) => {
            if (event.target === event.currentTarget) onChange(null)
          }}
          onTouchStart={(event) => {
            touchStart.current = event.touches[0].clientX
          }}
          onTouchEnd={(event) => {
            if (touchStart.current === null) return
            const dx = event.changedTouches[0].clientX - touchStart.current
            touchStart.current = null
            if (Math.abs(dx) > 50 && count > 1) go(dx < 0 ? 1 : -1)
          }}
        >
          <figure className="lightbox__figure">
            <img key={current.src} src={current.src} alt={current.caption ?? ''} className="lightbox__img" />
            <figcaption className="lightbox__caption">
              {current.caption && <span>{current.caption}</span>}
              {count > 1 && (
                <span className="lightbox__counter">
                  {index + 1} / {count}
                </span>
              )}
            </figcaption>
          </figure>
          {count > 1 && (
            <>
              <button type="button" className="lightbox__nav lightbox__nav--prev" onClick={() => go(-1)} aria-label={t('a11y.prev')}>
                <ChevronLeft />
              </button>
              <button type="button" className="lightbox__nav lightbox__nav--next" onClick={() => go(1)} aria-label={t('a11y.next')}>
                <ChevronRight />
              </button>
            </>
          )}
          <button type="button" className="lightbox__close" onClick={() => onChange(null)} aria-label={t('a11y.close')}>
            <X />
          </button>
        </div>
      )}
    </Dialog>
  )
}
