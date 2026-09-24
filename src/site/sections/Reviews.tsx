import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { ChevronLeft, ChevronRight, Quote } from 'lucide-react'
import { Stars } from '../../components/Stars'
import { useContent } from '../../content/context'
import { tr } from '../../content/localized'
import { useLang } from '../../i18n/useLang'
import { formatMonth } from '../../lib/format'
import { shownReviews } from '../layout/nav'
import { SectionHeading } from './SectionHeading'
import './Reviews.css'

export function Reviews() {
  const { t } = useTranslation()
  const lang = useLang()
  const { reviews } = useContent()
  const [index, setIndex] = useState(0)

  const visible = shownReviews(reviews, lang)
  if (visible.length === 0) return null

  const count = visible.length
  const current = visible[index % count]
  const author = tr(current.author, lang)
  const origin = tr(current.origin, lang)
  const initials = author
    .split(/\s+/)
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()

  return (
    <section id="reviews" className="section section--sand reviews" aria-labelledby="reviews-title">
      <div className="container reviews__inner">
        <SectionHeading id="reviews-title" center eyebrow={t('reviews.eyebrow')} title={t('reviews.title')} />

        <figure key={current.id} className="review">
          <Quote className="review__mark" strokeWidth={1} />
          <blockquote className="review__text">
            <p>{tr(current.text, lang)}</p>
          </blockquote>
          <figcaption className="review__author">
            <span className="review__avatar" aria-hidden="true">
              {initials || '★'}
            </span>
            <span className="review__who">
              <strong>{author}</strong>
              {origin && <span>{origin}</span>}
            </span>
            {(current.rating > 0 || current.source || current.date) && (
              <span className="review__meta">
                <Stars value={current.rating} />
                {current.source && <span>{t('reviews.source', { source: current.source })}</span>}
                {current.date && <span>{formatMonth(current.date, lang)}</span>}
              </span>
            )}
          </figcaption>
        </figure>

        {count > 1 && (
          <div className="reviews__nav">
            <button
              type="button"
              className="reviews__arrow"
              aria-label={t('a11y.prevReview')}
              onClick={() => setIndex((i) => (i - 1 + count) % count)}
            >
              <ChevronLeft />
            </button>
            <div className="reviews__dots">
              {visible.map((review, i) => (
                <button
                  key={review.id}
                  type="button"
                  aria-label={t('reviews.goTo', { n: i + 1 })}
                  aria-current={i === index % count}
                  onClick={() => setIndex(i)}
                />
              ))}
            </div>
            <button
              type="button"
              className="reviews__arrow"
              aria-label={t('a11y.nextReview')}
              onClick={() => setIndex((i) => (i + 1) % count)}
            >
              <ChevronRight />
            </button>
          </div>
        )}
      </div>
    </section>
  )
}
