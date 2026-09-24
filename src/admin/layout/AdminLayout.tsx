import { useCallback, useEffect, useState } from 'react'
import { NavLink, Outlet, useLocation } from 'react-router-dom'
import { signOut } from 'firebase/auth'
import {
  BedDouble,
  ExternalLink,
  Images,
  Inbox,
  LayoutDashboard,
  LogOut,
  Menu,
  MessageSquareQuote,
  Newspaper,
  Settings,
  Sparkles,
  X,
} from 'lucide-react'
import { LogoMark } from '../../components/Logo'
import { useAdminUser } from '../auth/context'
import { useToast } from '../components/feedback'
import { useNewBookings, type Booking } from '../lib/bookings'
import { getAdminAuth } from '../lib/firebase'
import { NewBookingsContext } from './newBookings'

const NAV = [
  { to: '/admin', label: 'Обзор', icon: LayoutDashboard, end: true },
  { to: '/admin/bookings', label: 'Заявки', icon: Inbox, badge: true },
  { to: '/admin/rooms', label: 'Номера и цены', icon: BedDouble },
  { to: '/admin/services', label: 'Услуги', icon: Sparkles },
  { to: '/admin/gallery', label: 'Галерея', icon: Images },
  { to: '/admin/reviews', label: 'Отзывы', icon: MessageSquareQuote },
  { to: '/admin/news', label: 'Новости', icon: Newspaper },
  { to: '/admin/settings', label: 'Настройки сайта', icon: Settings },
]

export function AdminLayout() {
  const user = useAdminUser()
  const toast = useToast()
  const location = useLocation()
  const [menuKey, setMenuKey] = useState<string | null>(null)
  const menuOpen = menuKey === location.key

  const onNewBooking = useCallback(
    (booking: Booking) => {
      toast.info(`Новая заявка: ${booking.name}`)
      if ('Notification' in window && Notification.permission === 'granted' && document.hidden) {
        new Notification('Новая заявка на бронирование', {
          body: `${booking.name} · ${booking.phone}`,
          icon: '/icon-192.png',
          tag: booking.id,
        })
      }
    },
    [toast],
  )
  const newBookings = useNewBookings(onNewBooking)

  // Each section starts at the top (search params like ?status= keep the position).
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' })
  }, [location.pathname])

  // Show the number of unhandled requests in the browser tab.
  useEffect(() => {
    const count = newBookings.length
    document.title = `${count ? `(${count}) ` : ''}Astoria — админ-панель`
  }, [newBookings.length])

  return (
    <NewBookingsContext.Provider value={newBookings}>
      <div className={`a-shell ${menuOpen ? 'is-menu-open' : ''}`}>
        <header className="a-topbar">
          <button
            type="button"
            className="a-icon-btn"
            onClick={() => setMenuKey(menuOpen ? null : location.key)}
            aria-label={menuOpen ? 'Закрыть меню' : 'Открыть меню'}
            aria-expanded={menuOpen}
          >
            {menuOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
          <span className="a-topbar__title">Astoria · админ-панель</span>
        </header>

        <aside className="a-sidebar">
          <div className="a-sidebar__brand">
            <LogoMark className="a-sidebar__mark" />
            <div>
              <strong>Astoria</strong>
              <span>Панель управления</span>
            </div>
          </div>
          <nav className="a-nav" aria-label="Разделы">
            {NAV.map(({ to, label, icon: Icon, end, badge }) => (
              <NavLink key={to} to={to} end={end} className="a-nav__link">
                <Icon size={19} strokeWidth={1.7} />
                <span>{label}</span>
                {badge && newBookings.length > 0 && <span className="a-nav__badge">{newBookings.length}</span>}
              </NavLink>
            ))}
          </nav>
          <div className="a-sidebar__footer">
            <a className="a-nav__link" href="/" target="_blank" rel="noopener noreferrer">
              <ExternalLink size={19} strokeWidth={1.7} />
              <span>Открыть сайт</span>
            </a>
            <div className="a-sidebar__user">
              <span title={user.email ?? ''}>{user.email}</span>
              <button type="button" className="a-icon-btn a-icon-btn--dark" onClick={() => signOut(getAdminAuth())} aria-label="Выйти" title="Выйти">
                <LogOut size={18} />
              </button>
            </div>
          </div>
        </aside>
        <button type="button" className="a-scrim" aria-label="Закрыть меню" tabIndex={-1} onClick={() => setMenuKey(null)} />

        <main className="a-main">
          <Outlet />
        </main>
      </div>
    </NewBookingsContext.Provider>
  )
}
