import { useId, useState, type FormEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { ArrowRight } from 'lucide-react'
import { useContent } from '../../content/context'
import { tr } from '../../content/localized'
import { useLang } from '../../i18n/useLang'
import { addDaysIso, todayIso } from '../../lib/format'
import { useOpenBooking } from '../booking/context'
import './BookingBar.css'

/** Quick date picker under the hero; hands the values over to the booking form. */
export function BookingBar() {
  const { t } = useTranslation()
  const lang = useLang()
  const { rooms } = useContent()
  const openBooking = useOpenBooking()
  const id = useId()
  const today = todayIso()
  const [checkIn, setCheckIn] = useState('')
  const [checkOut, setCheckOut] = useState('')
  const [guests, setGuests] = useState(2)
  const [roomId, setRoomId] = useState('')

  const onSubmit = (event: FormEvent) => {
    event.preventDefault()
    openBooking({ checkIn, checkOut, adults: guests, roomId })
  }

  return (
    <div className="container booking-bar-wrap">
      <form className="booking-bar reveal" onSubmit={onSubmit} aria-label={t('bookingBar.title')}>
        <div className="booking-bar__field">
          <label htmlFor={`${id}-in`}>{t('bookingBar.checkIn')}</label>
          <input
            id={`${id}-in`}
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
        <div className="booking-bar__field">
          <label htmlFor={`${id}-out`}>{t('bookingBar.checkOut')}</label>
          <input
            id={`${id}-out`}
            type="date"
            min={checkIn ? addDaysIso(checkIn, 1) : addDaysIso(today, 1)}
            value={checkOut}
            onChange={(e) => setCheckOut(e.target.value)}
          />
        </div>
        <div className="booking-bar__field">
          <label htmlFor={`${id}-guests`}>{t('bookingBar.guests')}</label>
          <select id={`${id}-guests`} value={guests} onChange={(e) => setGuests(Number(e.target.value))}>
            {[1, 2, 3, 4, 5, 6].map((n) => (
              <option key={n} value={n}>
                {t('units.guests', { count: n })}
              </option>
            ))}
          </select>
        </div>
        <div className="booking-bar__field booking-bar__field--room">
          <label htmlFor={`${id}-room`}>{t('bookingBar.room')}</label>
          <select id={`${id}-room`} value={roomId} onChange={(e) => setRoomId(e.target.value)}>
            <option value="">{t('bookingBar.anyRoom')}</option>
            {rooms
              .filter((r) => r.visible)
              .map((r) => (
                <option key={r.id} value={r.id}>
                  {tr(r.name, lang)}
                </option>
              ))}
          </select>
        </div>
        <button type="submit" className="btn btn--primary booking-bar__submit">
          {t('bookingBar.submit')}
          <ArrowRight />
        </button>
      </form>
    </div>
  )
}
