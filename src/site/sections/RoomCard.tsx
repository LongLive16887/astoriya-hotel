import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { BedDouble, ChevronLeft, ChevronRight, Maximize2, Users } from 'lucide-react'
import { Img } from '../../components/Img'
import { LogoMark } from '../../components/Logo'
import { tr } from '../../content/localized'
import type { Room } from '../../content/types'
import { useLang } from '../../i18n/useLang'
import { formatUsd, formatUzs } from '../../lib/format'
import { useOpenBooking } from '../booking/context'
import './RoomCard.css'

export function RoomCard({ room }: { room: Room }) {
  const { t } = useTranslation()
  const lang = useLang()
  const openBooking = useOpenBooking()
  const [index, setIndex] = useState(0)
  const name = tr(room.name, lang)
  const beds = tr(room.beds, lang)
  const href = `/rooms/${room.id}`
  const images = room.images
  const count = images.length
  const current = count ? images[index % count] : null

  return (
    <article className="room-card reveal">
      <div className="room-card__media">
        {current ? (
          <Link to={href} tabIndex={-1} aria-hidden="true">
            <Img key={current} src={current} alt="" />
          </Link>
        ) : (
          <div className="room-card__placeholder">
            <LogoMark />
          </div>
        )}
        {count > 1 && (
          <>
            <button
              type="button"
              className="room-card__arrow room-card__arrow--prev"
              aria-label={t('a11y.prev')}
              onClick={() => setIndex((i) => (i - 1 + count) % count)}
            >
              <ChevronLeft size={20} />
            </button>
            <button
              type="button"
              className="room-card__arrow room-card__arrow--next"
              aria-label={t('a11y.next')}
              onClick={() => setIndex((i) => (i + 1) % count)}
            >
              <ChevronRight size={20} />
            </button>
            <div className="room-card__dots" aria-hidden="true">
              {images.map((src, i) => (
                <span key={src + i} className={i === index % count ? 'is-active' : ''} />
              ))}
            </div>
          </>
        )}
      </div>

      <div className="room-card__body">
        <h3 className="h-card room-card__title">
          <Link to={href}>{name}</Link>
        </h3>
        {tr(room.summary, lang) && <p className="room-card__summary">{tr(room.summary, lang)}</p>}
        <ul className="room-card__meta">
          <li>
            <Users size={17} />
            {t('units.upToGuests', { count: room.guests })}
          </li>
          {beds && (
            <li>
              <BedDouble size={17} />
              {beds}
            </li>
          )}
          {room.area > 0 && (
            <li>
              <Maximize2 size={16} />
              {t('units.area', { value: room.area })}
            </li>
          )}
        </ul>

        <div className="room-card__footer">
          {room.priceUzs > 0 || room.priceUsd > 0 ? (
            <p className="room-card__price">
              {room.priceUzs > 0 ? (
                <strong>{formatUzs(room.priceUzs, lang)}</strong>
              ) : (
                <strong>{formatUsd(room.priceUsd)}</strong>
              )}
              <span>
                {t('units.perNight')}
                {room.priceUzs > 0 && room.priceUsd > 0 && ` · ≈ ${formatUsd(room.priceUsd)}`}
              </span>
            </p>
          ) : (
            <span />
          )}
          <div className="room-card__actions">
            <Link to={href} className="btn btn--outline btn--sm">
              {t('actions.details')}
            </Link>
            <button type="button" className="btn btn--primary btn--sm" onClick={() => openBooking({ roomId: room.id })}>
              {t('actions.book')}
            </button>
          </div>
        </div>
      </div>
    </article>
  )
}
