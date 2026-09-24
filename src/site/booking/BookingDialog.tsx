import { useId, useState, type FormEvent, type ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { CalendarDays, CircleAlert, CircleCheck, Phone, X } from 'lucide-react'
import { Dialog } from '../../components/Dialog'
import { TelegramIcon } from '../../components/BrandIcons'
import { useContent } from '../../content/context'
import { tr } from '../../content/localized'
import type { BookingRequest, Lang } from '../../content/types'
import { useLang } from '../../i18n/useLang'
import { validateBooking, BOOKING_LIMITS, type BookingErrors } from '../../lib/booking'
import { isFirebaseConfigured } from '../../lib/firebase'
import { addDaysIso, formatDate, formatUzs, nightsBetween, todayIso } from '../../lib/format'
import { telegramHref, telHref } from '../../lib/links'
import { submitBooking } from '../../lib/publicDb'
import type { BookingPrefill } from './context'
import './BookingDialog.css'

interface BookingDialogProps {
  /** null when the dialog is closed */
  prefill: BookingPrefill | null
  onClose: () => void
}

export function BookingDialog({ prefill, onClose }: BookingDialogProps) {
  return (
    <Dialog open={prefill !== null} onClose={onClose} labelledBy="booking-title" className="dialog--sheet booking">
      {prefill && <BookingForm prefill={prefill} onClose={onClose} />}
    </Dialog>
  )
}

type Status = 'idle' | 'sending' | 'sent' | 'error' | 'unavailable'

const FIELD_ORDER: (keyof BookingRequest)[] = [
  'checkIn',
  'checkOut',
  'adults',
  'children',
  'name',
  'phone',
  'email',
  'message',
]

function initialForm(prefill: BookingPrefill, lang: Lang): BookingRequest {
  const checkIn = prefill.checkIn ?? ''
  return {
    name: '',
    phone: '',
    email: '',
    message: '',
    checkIn,
    checkOut: prefill.checkOut ?? (checkIn ? addDaysIso(checkIn, 1) : ''),
    adults: prefill.adults ?? 2,
    children: prefill.children ?? 0,
    roomId: prefill.roomId ?? '',
    roomName: '',
    lang,
  }
}

function BookingForm({ prefill, onClose }: { prefill: BookingPrefill; onClose: () => void }) {
  const { t } = useTranslation()
  const lang = useLang()
  const { rooms, settings } = useContent()
  const uid = useId()
  const [form, setForm] = useState(() => initialForm(prefill, lang))
  const [submitted, setSubmitted] = useState(false)
  const [status, setStatus] = useState<Status>('idle')
  const [honeypot, setHoneypot] = useState('')
  const [copied, setCopied] = useState(false)

  const today = todayIso()
  const visibleRooms = rooms.filter((r) => r.visible)
  const room = visibleRooms.find((r) => r.id === form.roomId)
  const roomName = room ? tr(room.name, lang) : ''
  const nights = nightsBetween(form.checkIn, form.checkOut)
  const errors: BookingErrors = submitted ? validateBooking(form, today) : {}

  const set = <K extends keyof BookingRequest>(key: K, value: BookingRequest[K]) =>
    setForm((f) => ({ ...f, [key]: value }))

  const setCheckIn = (value: string) =>
    setForm((f) => ({
      ...f,
      checkIn: value,
      // Keep the stay at least one night long.
      checkOut: value && (!f.checkOut || f.checkOut <= value) ? addDaysIso(value, 1) : f.checkOut,
    }))

  const requestText = () =>
    t('booking.requestText', {
      checkIn: form.checkIn ? formatDate(form.checkIn, lang) : '—',
      checkOut: form.checkOut ? formatDate(form.checkOut, lang) : '—',
      guests: [
        t('units.adults', { count: form.adults }),
        form.children ? t('units.children', { count: form.children }) : '',
      ]
        .filter(Boolean)
        .join(', '),
      room: roomName || t('booking.anyRoom'),
      name: form.name.trim() || '—',
      phone: form.phone.trim() || '—',
    })

  const sendViaTelegram = async () => {
    try {
      await navigator.clipboard.writeText(requestText())
      setCopied(true)
    } catch {
      // Clipboard access can be denied; the chat still opens.
    }
    window.open(telegramHref(settings.telegram), '_blank', 'noopener')
  }

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setSubmitted(true)
    const found = validateBooking(form, today)
    const firstInvalid = FIELD_ORDER.find((key) => found[key])
    if (firstInvalid) {
      document.getElementById(`${uid}-${firstInvalid}`)?.focus()
      return
    }
    // Bots fill every field, including the hidden one.
    if (honeypot) {
      setStatus('sent')
      return
    }
    if (!isFirebaseConfigured) {
      setStatus('unavailable')
      return
    }
    setStatus('sending')
    try {
      await submitBooking({ ...form, roomName, lang })
      setStatus('sent')
    } catch (error) {
      console.error('Booking request failed', error)
      setStatus('error')
    }
  }

  const fieldProps = (key: keyof BookingRequest) => ({
    id: `${uid}-${key}`,
    'aria-invalid': errors[key] ? true : undefined,
    'aria-describedby': errors[key] ? `${uid}-${key}-error` : undefined,
  })

  const error = (key: keyof BookingRequest) =>
    errors[key] ? (
      <span id={`${uid}-${key}-error`} className="field__error">
        {t(`booking.errors.${errors[key]}`)}
      </span>
    ) : null

  const closeButton = (
    <button type="button" className="dialog__close" onClick={onClose} aria-label={t('a11y.close')}>
      <X size={20} />
    </button>
  )

  if (status === 'sent') {
    return (
      <div className="booking__body booking__done">
        {closeButton}
        <CircleCheck className="booking__done-icon" strokeWidth={1.25} />
        <h2 id="booking-title" className="h-card">
          {t('booking.successTitle')}
        </h2>
        <p>{t('booking.successText', { name: form.name.trim().split(' ')[0], phone: form.phone.trim() })}</p>
        <dl className="booking__summary">
          <div>
            <dt>{t('booking.checkIn')}</dt>
            <dd>{formatDate(form.checkIn, lang)}</dd>
          </div>
          <div>
            <dt>{t('booking.checkOut')}</dt>
            <dd>{formatDate(form.checkOut, lang)}</dd>
          </div>
          <div>
            <dt>{t('booking.room')}</dt>
            <dd>{roomName || t('booking.anyRoom')}</dd>
          </div>
        </dl>
        <button type="button" className="btn btn--primary" onClick={onClose}>
          {t('booking.done')}
        </button>
      </div>
    )
  }

  const directContacts = (
    <div className="booking__direct">
      <a className="btn btn--outline btn--sm" href={telHref(settings.phone)}>
        <Phone />
        {t('actions.call')}
      </a>
      <a className="btn btn--outline btn--sm" href={telegramHref(settings.telegram)} target="_blank" rel="noopener noreferrer">
        <TelegramIcon />
        {t('actions.telegram')}
      </a>
    </div>
  )

  return (
    <form className="booking__body" onSubmit={onSubmit} noValidate>
      {closeButton}
      <header className="booking__header">
        <span className="eyebrow">{settings.hotelName}</span>
        <h2 id="booking-title" className="h-card">
          {t('booking.title')}
        </h2>
        <p>{t('booking.subtitle')}</p>
      </header>

      <fieldset className="booking__group">
        <legend>
          <CalendarDays size={16} /> {t('booking.stay')}
        </legend>
        <div className="booking__grid">
          <Field label={t('booking.checkIn')} htmlFor={`${uid}-checkIn`} error={error('checkIn')}>
            <input
              {...fieldProps('checkIn')}
              className="field__control"
              type="date"
              min={today}
              value={form.checkIn}
              onChange={(e) => setCheckIn(e.target.value)}
              required
            />
          </Field>
          <Field label={t('booking.checkOut')} htmlFor={`${uid}-checkOut`} error={error('checkOut')}>
            <input
              {...fieldProps('checkOut')}
              className="field__control"
              type="date"
              min={form.checkIn ? addDaysIso(form.checkIn, 1) : addDaysIso(today, 1)}
              value={form.checkOut}
              onChange={(e) => set('checkOut', e.target.value)}
              required
            />
          </Field>
          <Field label={t('booking.adults')} htmlFor={`${uid}-adults`} error={error('adults')}>
            <select
              {...fieldProps('adults')}
              className="field__control"
              value={form.adults}
              onChange={(e) => set('adults', Number(e.target.value))}
            >
              {range(1, BOOKING_LIMITS.maxAdults).map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </select>
          </Field>
          <Field label={t('booking.children')} htmlFor={`${uid}-children`} error={error('children')}>
            <select
              {...fieldProps('children')}
              className="field__control"
              value={form.children}
              onChange={(e) => set('children', Number(e.target.value))}
            >
              {range(0, BOOKING_LIMITS.maxChildren).map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </select>
          </Field>
          {visibleRooms.length > 0 && (
            <Field label={t('booking.room')} htmlFor={`${uid}-roomId`} wide>
              <select
                id={`${uid}-roomId`}
                className="field__control"
                value={form.roomId}
                onChange={(e) => set('roomId', e.target.value)}
              >
                <option value="">{t('booking.anyRoom')}</option>
                {visibleRooms.map((r) => (
                  <option key={r.id} value={r.id}>
                    {tr(r.name, lang)}
                    {r.priceUzs > 0 ? ` — ${formatUzs(r.priceUzs, lang)}` : ''}
                  </option>
                ))}
              </select>
            </Field>
          )}
        </div>
        {room && room.priceUzs > 0 && nights > 0 && (
          <p className="booking__estimate">
            <strong>
              {t('booking.estimate', {
                amount: formatUzs(room.priceUzs * nights, lang),
                nights: t('units.nights', { count: nights }),
              })}
            </strong>
            <span>{t('booking.estimateNote')}</span>
          </p>
        )}
      </fieldset>

      <fieldset className="booking__group">
        <legend>{t('booking.contact')}</legend>
        <div className="booking__grid">
          <Field label={t('booking.name')} htmlFor={`${uid}-name`} error={error('name')}>
            <input
              {...fieldProps('name')}
              className="field__control"
              type="text"
              autoComplete="name"
              maxLength={BOOKING_LIMITS.name}
              value={form.name}
              onChange={(e) => set('name', e.target.value)}
              required
            />
          </Field>
          <Field label={t('booking.phone')} htmlFor={`${uid}-phone`} error={error('phone')}>
            <input
              {...fieldProps('phone')}
              className="field__control"
              type="tel"
              inputMode="tel"
              autoComplete="tel"
              placeholder="+998 90 123 45 67"
              maxLength={BOOKING_LIMITS.phone}
              value={form.phone}
              onChange={(e) => set('phone', e.target.value)}
              required
            />
          </Field>
          <Field label={t('booking.email')} optional={t('booking.optional')} htmlFor={`${uid}-email`} error={error('email')} wide>
            <input
              {...fieldProps('email')}
              className="field__control"
              type="email"
              autoComplete="email"
              maxLength={BOOKING_LIMITS.email}
              value={form.email}
              onChange={(e) => set('email', e.target.value)}
            />
          </Field>
          <Field label={t('booking.message')} optional={t('booking.optional')} htmlFor={`${uid}-message`} error={error('message')} wide>
            <textarea
              {...fieldProps('message')}
              className="field__control"
              rows={3}
              maxLength={BOOKING_LIMITS.message}
              placeholder={t('booking.messagePlaceholder')}
              value={form.message}
              onChange={(e) => set('message', e.target.value)}
            />
          </Field>
        </div>
        <label className="booking__trap" aria-hidden="true">
          Website
          <input tabIndex={-1} autoComplete="off" value={honeypot} onChange={(e) => setHoneypot(e.target.value)} />
        </label>
      </fieldset>

      {(status === 'error' || status === 'unavailable') && (
        <div className="booking__alert" role="alert">
          <CircleAlert size={20} />
          <div>
            {status === 'error' && <strong>{t('booking.errorTitle')}</strong>}
            <p>{status === 'error' ? t('booking.errorText') : t('booking.unavailable')}</p>
            <button type="button" className="btn btn--primary btn--sm" onClick={sendViaTelegram}>
              <TelegramIcon />
              {t('booking.copyAndOpen')}
            </button>
            {copied && <p className="booking__copied">{t('booking.copied')}</p>}
          </div>
        </div>
      )}

      <div className="booking__actions">
        <button type="submit" className="btn btn--primary btn--block" disabled={status === 'sending'}>
          {status === 'sending' ? t('booking.sending') : t('booking.submit')}
        </button>
        <p className="booking__consent">{t('booking.consent')}</p>
      </div>

      <div className="booking__or">
        <span>{t('booking.orContact')}</span>
      </div>
      {directContacts}
    </form>
  )
}

function Field({
  label,
  optional,
  htmlFor,
  error,
  wide,
  children,
}: {
  label: string
  optional?: string
  htmlFor: string
  error?: ReactNode
  wide?: boolean
  children: ReactNode
}) {
  return (
    <div className={`field ${wide ? 'field--wide' : ''}`}>
      <label className="field__label" htmlFor={htmlFor}>
        {label}
        {optional && <span className="field__optional">{optional}</span>}
      </label>
      {children}
      {error}
    </div>
  )
}

const range = (from: number, to: number) => Array.from({ length: to - from + 1 }, (_, i) => from + i)
