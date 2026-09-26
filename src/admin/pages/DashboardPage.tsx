import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Bell, BedDouble, CalendarCheck, ExternalLink, ImagePlus, Inbox, Newspaper, TrendingUp } from 'lucide-react'
import { addDaysIso, todayIso } from '../../lib/format'
import { useAdminUser } from '../auth/context'
import { useToast } from '../components/feedback'
import { EmptyState, PageHeader } from '../components/PageHeader'
import { StatusBadge } from '../components/StatusBadge'
import { useArrivals, useBookingsSince } from '../lib/bookings'
import { useContentDoc } from '../lib/content'
import { formatDateTime, greeting, guestsLabel, stayLabel } from '../lib/format'
import { notificationsSupported } from '../lib/notifications'
import { useNewBookingsList } from '../layout/newBookings'

export function DashboardPage() {
  const user = useAdminUser()
  const toast = useToast()
  const newBookings = useNewBookingsList()
  const rooms = useContentDoc('rooms')
  const [weekAgo] = useState(() => Date.now() - 7 * 86_400_000)
  const [permission, setPermission] = useState(() => (notificationsSupported ? Notification.permission : 'unsupported'))

  const today = todayIso()
  const lastWeek = useBookingsSince(weekAgo)
  const arrivals = useArrivals(today, addDaysIso(today, 7))
  const upcoming = arrivals.bookings.filter((b) => b.status === 'confirmed')
  const loading = lastWeek.loading || arrivals.loading
  const visibleRooms = rooms.data.filter((r) => r.visible).length

  const enableNotifications = async () => {
    const result = await Notification.requestPermission()
    setPermission(result)
    if (result === 'granted') toast.success('Уведомления о новых заявках включены')
  }

  return (
    <div className="a-page">
      <PageHeader
        title={`${greeting()}!`}
        description={`Вы вошли как ${user.email}. Здесь — сводка по заявкам и быстрые действия.`}
        actions={
          <a className="a-btn" href="/" target="_blank" rel="noopener noreferrer">
            <ExternalLink size={16} /> Открыть сайт
          </a>
        }
      />

      <div className="a-stat-grid">
        <Link to="/admin/bookings?status=new" className="a-stat a-stat--accent">
          <span className="a-stat__label">
            <Inbox size={16} /> Новые заявки
          </span>
          <span className="a-stat__value">{newBookings.length}</span>
        </Link>
        <div className="a-stat">
          <span className="a-stat__label">
            <TrendingUp size={16} /> Заявок за 7 дней
          </span>
          <span className="a-stat__value">{loading ? '…' : lastWeek.bookings.length}</span>
        </div>
        <div className="a-stat">
          <span className="a-stat__label">
            <CalendarCheck size={16} /> Заезды на неделе
          </span>
          <span className="a-stat__value">{loading ? '…' : upcoming.length}</span>
        </div>
        <Link to="/admin/rooms" className="a-stat">
          <span className="a-stat__label">
            <BedDouble size={16} /> Номеров на сайте
          </span>
          <span className="a-stat__value">{visibleRooms}</span>
        </Link>
      </div>

      <div className="a-columns">
        <section className="a-card">
          <div className="a-card__head">
            <h2 className="a-card__title">Новые заявки</h2>
            <Link to="/admin/bookings" className="a-btn a-btn--sm a-btn--ghost">
              Все заявки
            </Link>
          </div>
          {newBookings.length === 0 ? (
            <EmptyState title="Новых заявок нет" text="Как только гость отправит заявку с сайта, она появится здесь." />
          ) : (
            <ul className="a-mini-list">
              {[...newBookings]
                .sort((a, b) => (b.createdAt?.getTime() ?? 0) - (a.createdAt?.getTime() ?? 0))
                .slice(0, 6)
                .map((b) => (
                  <li key={b.id}>
                    <Link to={`/admin/bookings?status=new&id=${b.id}`}>
                      <span className="a-cell-strong">{b.name}</span>
                      <span className="a-cell-muted">
                        {stayLabel(b)} · {guestsLabel(b.adults, b.children)}
                      </span>
                    </Link>
                    <span className="a-cell-muted">{formatDateTime(b.createdAt)}</span>
                  </li>
                ))}
            </ul>
          )}
        </section>

        <section className="a-card">
          <div className="a-card__head">
            <h2 className="a-card__title">Ближайшие заезды</h2>
            <Link to="/admin/bookings?status=confirmed" className="a-btn a-btn--sm a-btn--ghost">
              Подтверждённые
            </Link>
          </div>
          {upcoming.length === 0 ? (
            <EmptyState title="На ближайшие 7 дней заездов нет" text="Здесь появятся подтверждённые брони с заездом в ближайшую неделю." />
          ) : (
            <ul className="a-mini-list">
              {upcoming.slice(0, 6).map((b) => (
                <li key={b.id}>
                  <Link to={`/admin/bookings?status=confirmed&id=${b.id}`}>
                    <span className="a-cell-strong">{b.name}</span>
                    <span className="a-cell-muted">
                      {stayLabel(b)}
                      {b.roomName ? ` · ${b.roomName}` : ''}
                    </span>
                  </Link>
                  <StatusBadge status={b.status} />
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      <section className="a-card">
        <h2 className="a-card__title">Быстрые действия</h2>
        <div className="a-page-header__actions">
          <Link to="/admin/rooms/new" className="a-btn">
            <BedDouble size={16} /> Добавить номер
          </Link>
          <Link to="/admin/news/new" className="a-btn">
            <Newspaper size={16} /> Написать новость
          </Link>
          <Link to="/admin/gallery" className="a-btn">
            <ImagePlus size={16} /> Загрузить фото
          </Link>
          {permission !== 'unsupported' && permission !== 'granted' && (
            <button type="button" className="a-btn" onClick={enableNotifications} disabled={permission === 'denied'}>
              <Bell size={16} />
              {permission === 'denied' ? 'Уведомления запрещены в браузере' : 'Уведомлять о новых заявках'}
            </button>
          )}
        </div>
        {permission === 'granted' && (
          <p className="a-hint">
            Уведомления включены: пока эта вкладка открыта, браузер сообщит о каждой новой заявке.
          </p>
        )}
      </section>
    </div>
  )
}
