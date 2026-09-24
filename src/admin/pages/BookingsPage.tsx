import { useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Download, Inbox, Search } from 'lucide-react'
import { BOOKING_STATUSES, type BookingStatus } from '../../content/types'
import { EmptyState, PageHeader, Spinner } from '../components/PageHeader'
import { StatusBadge } from '../components/StatusBadge'
import { bookingsToCsv, useBooking, useBookings, type Booking } from '../lib/bookings'
import { formatDateTime, guestsLabel, stayLabel } from '../lib/format'
import { BookingDrawer } from './BookingDrawer'

type Tab = BookingStatus | 'all'

const TABS: { key: Tab; label: string }[] = [
  { key: 'new', label: 'Новые' },
  { key: 'confirmed', label: 'Подтверждённые' },
  { key: 'completed', label: 'Завершённые' },
  { key: 'cancelled', label: 'Отменённые' },
  { key: 'all', label: 'Все' },
]

const PAGE = 200

function matches(b: Booking, query: string) {
  if (!query) return true
  const q = query.toLowerCase()
  const digits = q.replace(/\D/g, '')
  return (
    b.name.toLowerCase().includes(q) ||
    b.email.toLowerCase().includes(q) ||
    b.roomName.toLowerCase().includes(q) ||
    (digits.length >= 3 && b.phone.replace(/\D/g, '').includes(digits))
  )
}

export function BookingsPage() {
  const [params, setParams] = useSearchParams()
  const [max, setMax] = useState(PAGE)
  const [query, setQuery] = useState('')
  const { bookings, loading, error } = useBookings(max)

  const statusParam = params.get('status')
  const tab: Tab = statusParam && (BOOKING_STATUSES as readonly string[]).includes(statusParam) ? (statusParam as BookingStatus) : statusParam === 'all' ? 'all' : 'new'
  const openId = params.get('id')
  const listed = bookings.find((b) => b.id === openId)
  // Links from the dashboard may point to a request older than the loaded list.
  const fetched = useBooking(!loading && openId && !listed ? openId : null)
  const open = listed ?? fetched

  const counts = Object.fromEntries(TABS.map((t) => [t.key, t.key === 'all' ? bookings.length : bookings.filter((b) => b.status === t.key).length]))
  const shown = bookings.filter((b) => (tab === 'all' || b.status === tab) && matches(b, query.trim()))

  const setParam = (key: string, value: string | null) =>
    setParams(
      (prev) => {
        const next = new URLSearchParams(prev)
        if (value === null) next.delete(key)
        else next.set(key, value)
        return next
      },
      { replace: key === 'id' && value === null },
    )

  const exportCsv = () => {
    const blob = new Blob([bookingsToCsv(shown)], { type: 'text/csv;charset=utf-8' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = `astoria-zayavki-${new Date().toISOString().slice(0, 10)}.csv`
    link.click()
    URL.revokeObjectURL(link.href)
  }

  return (
    <div className="a-page">
      <PageHeader
        title="Заявки на бронирование"
        description="Заявки с сайта появляются здесь сразу. Свяжитесь с гостем, подтвердите бронь и отметьте статус."
        actions={
          <button type="button" className="a-btn" onClick={exportCsv} disabled={shown.length === 0}>
            <Download size={16} /> Экспорт в Excel (CSV)
          </button>
        }
      />

      <div className="a-tabs" role="tablist" aria-label="Статус заявок">
        {TABS.map((t) => (
          <button
            key={t.key}
            type="button"
            role="tab"
            aria-selected={tab === t.key}
            className="a-tab"
            onClick={() => setParam('status', t.key)}
          >
            {t.label}
            <span className="a-tab__count">{counts[t.key]}</span>
          </button>
        ))}
      </div>

      <div className="a-toolbar">
        <label className="a-search">
          <Search size={16} />
          <input
            className="a-input"
            type="search"
            placeholder="Поиск: имя, телефон, email"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            aria-label="Поиск по заявкам"
          />
        </label>
      </div>

      {error && <p className="a-alert a-alert--danger">Не удалось загрузить заявки: {error}</p>}

      {loading ? (
        <Spinner />
      ) : shown.length === 0 ? (
        <EmptyState
          icon={<Inbox />}
          title={query ? 'Ничего не найдено' : tab === 'new' ? 'Новых заявок нет' : 'Заявок нет'}
          text={tab === 'new' && !query ? 'Все заявки обработаны. Новые появятся здесь автоматически.' : undefined}
        />
      ) : (
        <div className="a-list">
          <table className="a-table a-only-desktop">
            <thead>
              <tr>
                <th>Получена</th>
                <th>Гость</th>
                <th>Проживание</th>
                <th>Номер</th>
                <th>Статус</th>
              </tr>
            </thead>
            <tbody>
              {shown.map((b) => (
                <tr key={b.id} className={b.status === 'new' ? 'is-new' : ''} onClick={() => setParam('id', b.id)}>
                  <td>
                    <span className="a-cell-muted">{formatDateTime(b.createdAt)}</span>
                  </td>
                  <td>
                    <button
                      type="button"
                      className="a-cell-strong a-link-button"
                      onClick={(event) => {
                        event.stopPropagation() // the row would open it a second time
                        setParam('id', b.id)
                      }}
                    >
                      {b.name}
                    </button>
                    <span className="a-cell-muted">{b.phone}</span>
                  </td>
                  <td>
                    <span>{stayLabel(b)}</span>
                    <span className="a-cell-muted">{guestsLabel(b.adults, b.children)}</span>
                  </td>
                  <td>{b.roomName || <span className="a-cell-muted">Любой</span>}</td>
                  <td>
                    <StatusBadge status={b.status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <ul className="a-only-mobile">
            {shown.map((b) => (
              <li key={b.id} className="a-row">
                <button type="button" className="a-row__main a-row__button" onClick={() => setParam('id', b.id)}>
                  <span className="a-row__title">{b.name}</span>
                  <span className="a-row__meta">{stayLabel(b)}</span>
                  <span className="a-row__meta">
                    {b.phone} · {formatDateTime(b.createdAt)}
                  </span>
                </button>
                <StatusBadge status={b.status} />
              </li>
            ))}
          </ul>
        </div>
      )}

      {!loading && bookings.length >= max && (
        <button type="button" className="a-btn" onClick={() => setMax((m) => m + PAGE)}>
          Показать более старые заявки
        </button>
      )}

      <BookingDrawer booking={open} onClose={() => setParam('id', null)} />
    </div>
  )
}
