import { useId, useState, type FormEvent } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { BedDouble, Clock, Images, Maximize2, Phone, Users } from 'lucide-react'
import { TelegramIcon } from '../../components/BrandIcons'
import { AMENITY_ICONS } from '../../components/icons'
import { Img } from '../../components/Img'
import { Lightbox } from '../../components/Lightbox'
import { LogoMark } from '../../components/Logo'
import { useContent } from '../../content/context'
import { paragraphs, tr } from '../../content/localized'
import type { Room } from '../../content/types'
import { useLang } from '../../i18n/useLang'
import { BOOKING_LIMITS } from '../../lib/booking'
import { addDaysIso, formatUsd, formatUzs, todayIso } from '../../lib/format'
import { telegramHref, telHref } from '../../lib/links'
import { useOpenBooking } from '../booking/context'
import { sectionLink } from '../layout/nav'
import { RoomCard } from '../sections/RoomCard'
import { SectionHeading } from '../sections/SectionHeading'
import { useDocumentMeta } from '../useDocumentMeta'
import { NotFoundView } from './NotFoundView'
import './pages.css'

export function RoomPage() {
  const { roomId } = useParams()
  const { t } = useTranslation()
  const lang = useLang()
  const { rooms } = useContent()
  const room = rooms.find((r) => r.id === roomId && r.visible)

  useDocumentMeta(room ? tr(room.name, lang) : t('rooms.notFound'), room ? tr(room.summary, lang) : undefined)

  if (!room) {
    return (
      <NotFoundView title={t('rooms.notFound')} text={t('rooms.notFoundText')}>
        <Link className="btn btn--outline" to={sectionLink('rooms')}>
          {t('actions.viewRooms')}
        </Link>
      </NotFoundView>
    )
  }

  // Keyed by id so that moving to another room starts with fresh state.
  return <RoomDetails key={room.id} room={room} others={rooms.filter((r) => r.visible && r.id !== room.id)} />
}

function RoomDetails({ room, others }: { room: Room; others: Room[] }) {
  const { t } = useTranslation()
  const lang = useLang()
  const { settings } = useContent()
  const openBooking = useOpenBooking()
  const id = useId()
  const [lightbox, setLightbox] = useState<number | null>(null)
  const [checkIn, setCheckIn] = useState('')
  const [checkOut, setCheckOut] = useState('')
  // A request can book at most BOOKING_LIMITS.maxAdults adults, even for a bigger room.
  const maxAdults = Math.max(1, Math.min(room.guests, BOOKING_LIMITS.maxAdults))
  const [adults, setAdults] = useState(Math.min(2, maxAdults))
  const today = todayIso()

  const name = tr(room.name, lang)
  const summary = tr(room.summary, lang)
  const beds = tr(room.beds, lang)
  const images = room.images

  const onSubmit = (event: FormEvent) => {
    event.preventDefault()
    openBooking({ roomId: room.id, checkIn, checkOut, adults })
  }

  return (
    <article className="page room-page">
      <div className="container">
        <nav className="breadcrumbs" aria-label={t('a11y.breadcrumb')}>
          <Link to="/">{settings.hotelName}</Link>
          <span aria-hidden="true">/</span>
          <Link to={sectionLink('rooms')}>{t('nav.rooms')}</Link>
          <span aria-hidden="true">/</span>
          <span aria-current="page">{name}</span>
        </nav>

        <header className="room-page__header">
          <p className="eyebrow">{t('rooms.eyebrow')}</p>
          <h1 className="h-section">{name}</h1>
          {summary && <p className="lead">{summary}</p>}
        </header>

        <RoomGallery images={images} onOpen={setLightbox} />

        <div className="room-page__layout">
          <div className="room-page__main">
            <dl className="room-facts">
              <div>
                <dt>
                  <Users size={18} /> {t('rooms.capacity')}
                </dt>
                <dd>{t('units.upToGuests', { count: room.guests })}</dd>
              </div>
              {beds && (
                <div>
                  <dt>
                    <BedDouble size={18} /> {t('rooms.beds')}
                  </dt>
                  <dd>{beds}</dd>
                </div>
              )}
              {room.area > 0 && (
                <div>
                  <dt>
                    <Maximize2 size={18} /> {t('rooms.size')}
                  </dt>
                  <dd>{t('units.area', { value: room.area })}</dd>
                </div>
              )}
            </dl>

            <section className="room-page__section">
              <h2 className="room-page__h2">{t('rooms.about')}</h2>
              <div className="prose">
                {paragraphs(tr(room.description, lang) || summary).map((text, i) => (
                  <p key={i}>{text}</p>
                ))}
              </div>
            </section>

            {room.amenities.length > 0 && (
              <section className="room-page__section">
                <h2 className="room-page__h2">{t('rooms.amenities')}</h2>
                <ul className="amenities">
                  {room.amenities.map((amenity) => {
                    const Icon = AMENITY_ICONS[amenity]
                    return (
                      <li key={amenity}>
                        <Icon strokeWidth={1.5} />
                        {t(`amenities.${amenity}`)}
                      </li>
                    )
                  })}
                </ul>
              </section>
            )}
          </div>

          <aside className="room-page__aside">
            <form className="booking-card" onSubmit={onSubmit}>
              {(room.priceUzs > 0 || room.priceUsd > 0) && (
                <p className="booking-card__price">
                  <strong>{room.priceUzs > 0 ? formatUzs(room.priceUzs, lang) : formatUsd(room.priceUsd)}</strong>
                  <span>
                    {t('rooms.priceNote')}
                    {room.priceUzs > 0 && room.priceUsd > 0 && ` · ≈ ${formatUsd(room.priceUsd)}`}
                  </span>
                </p>
              )}
              <div className="booking-card__fields">
                <div className="field">
                  <label className="field__label" htmlFor={`${id}-in`}>
                    {t('booking.checkIn')}
                  </label>
                  <input
                    id={`${id}-in`}
                    className="field__control"
                    type="date"
                    min={today}
                    value={checkIn}
                    onChange={(e) => {
                      const value = e.target.value
                      setCheckIn(value)
                      if (value && (!checkOut || checkOut <= value)) setCheckOut(addDaysIso(value, 1))
                    }}
                  />
                </div>
                <div className="field">
                  <label className="field__label" htmlFor={`${id}-out`}>
                    {t('booking.checkOut')}
                  </label>
                  <input
                    id={`${id}-out`}
                    className="field__control"
                    type="date"
                    min={checkIn ? addDaysIso(checkIn, 1) : addDaysIso(today, 1)}
                    value={checkOut}
                    onChange={(e) => setCheckOut(e.target.value)}
                  />
                </div>
                <div className="field field--wide">
                  <label className="field__label" htmlFor={`${id}-adults`}>
                    {t('booking.adults')}
                  </label>
                  <select
                    id={`${id}-adults`}
                    className="field__control"
                    value={adults}
                    onChange={(e) => setAdults(Number(e.target.value))}
                  >
                    {Array.from({ length: maxAdults }, (_, i) => i + 1).map((n) => (
                      <option key={n} value={n}>
                        {t('units.adults', { count: n })}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <button type="submit" className="btn btn--primary btn--block">
                {t('actions.bookThisRoom')}
              </button>
              <p className="booking-card__policies">
                <Clock size={16} />
                {t('rooms.policies', { checkIn: settings.checkIn, checkOut: settings.checkOut })}
              </p>
              <div className="booking-card__contacts">
                <a href={telHref(settings.phone)} className="btn btn--outline btn--sm">
                  <Phone />
                  {t('actions.call')}
                </a>
                {settings.telegram && (
                  <a href={telegramHref(settings.telegram)} target="_blank" rel="noopener noreferrer" className="btn btn--outline btn--sm">
                    <TelegramIcon />
                    {t('actions.telegram')}
                  </a>
                )}
              </div>
            </form>
          </aside>
        </div>
      </div>

      {others.length > 0 && (
        <section className="section section--sand room-page__others" aria-labelledby="other-rooms">
          <div className="container">
            <SectionHeading id="other-rooms" eyebrow={t('rooms.eyebrow')} title={t('rooms.other')} />
            <div className="rooms-grid">
              {others.map((r) => (
                <RoomCard key={r.id} room={r} />
              ))}
            </div>
          </div>
        </section>
      )}

      <Lightbox images={images.map((src) => ({ src, caption: name }))} index={lightbox} onChange={setLightbox} />
    </article>
  )
}

function RoomGallery({ images, onOpen }: { images: string[]; onOpen: (index: number) => void }) {
  const { t } = useTranslation()
  if (images.length === 0) {
    return (
      <div className="room-gallery room-gallery--empty">
        <LogoMark />
      </div>
    )
  }
  const shown = images.slice(0, 3)
  const hidden = images.length - shown.length
  return (
    <div className={`room-gallery room-gallery--${shown.length}`}>
      {shown.map((src, i) => (
        <button
          key={src + i}
          type="button"
          className="room-gallery__item"
          onClick={() => onOpen(i)}
          aria-label={t('a11y.photo', { n: i + 1, total: images.length })}
        >
          <Img src={src} alt="" loading={i === 0 ? 'eager' : 'lazy'} sizes="(max-width: 640px) 86vw, 66vw" />
          {i === shown.length - 1 && hidden > 0 && (
            <span className="room-gallery__more">
              <Images size={18} /> +{hidden}
            </span>
          )}
        </button>
      ))}
    </div>
  )
}
