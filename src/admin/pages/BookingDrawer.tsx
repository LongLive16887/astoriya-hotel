import { useState } from 'react'
import { Mail, Phone, Trash2, X } from 'lucide-react'
import { Dialog } from '../../components/Dialog'
import { TelegramIcon, WhatsAppIcon } from '../../components/BrandIcons'
import { tr } from '../../content/localized'
import type { BookingStatus } from '../../content/types'
import { formatUzs, nightsBetween } from '../../lib/format'
import { errorMessage, useConfirm, useToast } from '../components/feedback'
import { StatusBadge } from '../components/StatusBadge'
import { deleteBooking, STATUS_LABELS, updateBooking, type Booking } from '../lib/bookings'
import { useContentDoc } from '../lib/content'
import { formatDateTime, guestsLabel, internationalPhone, LANG_LABELS, stayLabel } from '../lib/format'

const ACTIONS: { status: BookingStatus; label: string }[] = [
  { status: 'confirmed', label: 'Подтвердить' },
  { status: 'completed', label: 'Гость выехал' },
  { status: 'cancelled', label: 'Отменить' },
  { status: 'new', label: 'Вернуть в новые' },
]

export function BookingDrawer({ booking, onClose }: { booking: Booking | null; onClose: () => void }) {
  return (
    <Dialog open={booking !== null} onClose={onClose} labelledBy="a-booking-title" className="a-drawer">
      {booking && <DrawerBody key={booking.id} booking={booking} onClose={onClose} />}
    </Dialog>
  )
}

function DrawerBody({ booking, onClose }: { booking: Booking; onClose: () => void }) {
  const toast = useToast()
  const confirm = useConfirm()
  const rooms = useContentDoc('rooms')
  const [note, setNote] = useState(booking.note)
  const [busy, setBusy] = useState(false)

  const phone = internationalPhone(booking.phone)
  const room = rooms.data.find((r) => r.id === booking.roomId)
  const nights = nightsBetween(booking.checkIn, booking.checkOut)
  const estimate = room && room.priceUzs > 0 && nights > 0 ? room.priceUzs * nights : 0

  const run = async (action: () => Promise<void>, success: string) => {
    setBusy(true)
    try {
      await action()
      toast.success(success)
    } catch (error) {
      toast.error(errorMessage(error))
    } finally {
      setBusy(false)
    }
  }

  const remove = async () => {
    const ok = await confirm({
      title: 'Удалить заявку?',
      text: `Заявка ${booking.name} будет удалена без возможности восстановления.`,
      confirmLabel: 'Удалить',
      danger: true,
    })
    if (!ok) return
    await run(() => deleteBooking(booking.id), 'Заявка удалена')
    onClose()
  }

  return (
    <div className="a-drawer__body">
      <header className="a-drawer__header">
        <div>
          <h2 id="a-booking-title">{booking.name}</h2>
          <p className="a-hint">Получена {formatDateTime(booking.createdAt)}</p>
        </div>
        <div className="a-page-header__actions">
          <StatusBadge status={booking.status} />
          <button type="button" className="a-icon-btn" onClick={onClose} aria-label="Закрыть">
            <X size={20} />
          </button>
        </div>
      </header>

      <section className="a-field">
        <h3 className="a-section-title">Связаться с гостем</h3>
        <div className="a-contact-buttons">
          {/* Without a known country code the number is dialled as the guest typed it. */}
          <a className="a-btn a-btn--primary a-btn--sm" href={`tel:${phone ?? booking.phone.replace(/[^\d+]/g, '')}`}>
            <Phone size={16} /> {booking.phone}
          </a>
          {phone && (
            <>
              <a className="a-btn a-btn--sm" href={`https://t.me/${phone}`} target="_blank" rel="noopener noreferrer">
                <TelegramIcon size={16} /> Telegram
              </a>
              <a className="a-btn a-btn--sm" href={`https://wa.me/${phone.slice(1)}`} target="_blank" rel="noopener noreferrer">
                <WhatsAppIcon size={16} /> WhatsApp
              </a>
            </>
          )}
          {booking.email && (
            <a className="a-btn a-btn--sm" href={`mailto:${booking.email}`}>
              <Mail size={16} /> {booking.email}
            </a>
          )}
        </div>
      </section>

      <section className="a-field">
        <h3 className="a-section-title">Детали заявки</h3>
        <dl className="a-dl">
          <dt>Даты</dt>
          <dd>{stayLabel(booking)}</dd>
          <dt>Гости</dt>
          <dd>{guestsLabel(booking.adults, booking.children)}</dd>
          <dt>Номер</dt>
          <dd>{booking.roomName || (room ? tr(room.name, 'ru') : 'Любой свободный')}</dd>
          {estimate > 0 && (
            <>
              <dt>Стоимость</dt>
              <dd>≈ {formatUzs(estimate, 'ru')} (по цене на сайте)</dd>
            </>
          )}
          <dt>Язык сайта</dt>
          <dd>{LANG_LABELS[booking.lang]}</dd>
          {booking.message && (
            <>
              <dt>Пожелания</dt>
              <dd className="a-pre-wrap">{booking.message}</dd>
            </>
          )}
        </dl>
      </section>

      <section className="a-field">
        <h3 className="a-section-title">Статус</h3>
        <div className="a-status-buttons">
          {ACTIONS.filter((a) => a.status !== booking.status).map((a) => (
            <button
              key={a.status}
              type="button"
              className={`a-btn a-btn--sm ${a.status === 'confirmed' ? 'a-btn--primary' : ''}`}
              disabled={busy}
              onClick={() => run(() => updateBooking(booking.id, { status: a.status }), `Статус: ${STATUS_LABELS[a.status]}`)}
            >
              {a.label}
            </button>
          ))}
        </div>
      </section>

      <section className="a-field">
        <label className="a-section-title" htmlFor="a-booking-note">
          Заметка для персонала
        </label>
        <textarea
          id="a-booking-note"
          className="a-input a-textarea"
          rows={3}
          placeholder="Например: подтвердили по телефону, предоплата получена"
          value={note}
          onChange={(e) => setNote(e.target.value)}
        />
        <div className="a-page-header__actions">
          <button
            type="button"
            className="a-btn a-btn--sm"
            disabled={busy || note === booking.note}
            onClick={() => run(() => updateBooking(booking.id, { note }), 'Заметка сохранена')}
          >
            Сохранить заметку
          </button>
        </div>
      </section>

      <footer>
        <button type="button" className="a-btn a-btn--sm a-btn--ghost a-btn--danger-text" onClick={remove} disabled={busy}>
          <Trash2 size={16} /> Удалить заявку
        </button>
      </footer>
    </div>
  )
}
