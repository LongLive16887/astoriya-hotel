import { useEffect, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Menu, Phone, X } from 'lucide-react'
import { Logo } from '../../components/Logo'
import { InstagramIcon, TelegramIcon } from '../../components/BrandIcons'
import { useContent } from '../../content/context'
import { instagramHref, telegramHref, telHref } from '../../lib/links'
import { useOpenBooking } from '../booking/context'
import { LanguageSwitcher } from './LanguageSwitcher'
import { NAV_SECTIONS, sectionLink } from './nav'
import './Header.css'

/**
 * Transparent over the dark hero on the home page, solid everywhere else
 * and as soon as the page is scrolled.
 */
export function Header({ overlay }: { overlay: boolean }) {
  const { t } = useTranslation()
  const { settings } = useContent()
  const openBooking = useOpenBooking()
  const location = useLocation()
  const [scrolled, setScrolled] = useState(() => window.scrollY > 24)
  // The menu belongs to the page it was opened on, so any navigation closes it.
  const [menuKey, setMenuKey] = useState<string | null>(null)
  const menuOpen = menuKey === location.key
  const setMenuOpen = (open: boolean) => setMenuKey(open ? location.key : null)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    if (!menuOpen) return
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setMenuKey(null)
    }
    document.documentElement.classList.add('menu-open')
    window.addEventListener('keydown', onKey)
    return () => {
      document.documentElement.classList.remove('menu-open')
      window.removeEventListener('keydown', onKey)
    }
  }, [menuOpen])

  const solid = !overlay || scrolled
  const light = !solid || menuOpen

  return (
    <header className={`site-header ${solid ? 'is-solid' : ''} ${light ? 'is-light' : ''} ${menuOpen ? 'is-open' : ''}`}>
      <div className="container site-header__bar">
        <Link to="/" className="site-header__logo" aria-label={t('a11y.home')}>
          <Logo />
        </Link>

        <nav className="site-header__nav" aria-label={t('a11y.mainNav')}>
          {NAV_SECTIONS.map((item) => (
            <Link key={item.id} to={sectionLink(item.id)} className="site-header__link">
              {t(item.label)}
            </Link>
          ))}
        </nav>

        <div className="site-header__actions">
          <LanguageSwitcher className="site-header__lang" />
          <button
            type="button"
            className={`btn btn--sm ${light ? 'btn--brass' : 'btn--primary'} site-header__book`}
            onClick={() => openBooking()}
          >
            {t('actions.book')}
          </button>
          <button
            type="button"
            className="site-header__burger"
            aria-expanded={menuOpen}
            aria-controls="mobile-menu"
            aria-label={menuOpen ? t('a11y.closeMenu') : t('a11y.menu')}
            onClick={() => setMenuOpen(!menuOpen)}
          >
            {menuOpen ? <X /> : <Menu />}
          </button>
        </div>
      </div>

      <div id="mobile-menu" className="mobile-menu" hidden={!menuOpen}>
        <div className="container mobile-menu__inner">
          <nav className="mobile-menu__nav" aria-label={t('a11y.mainNav')}>
            {NAV_SECTIONS.map((item, i) => (
              <Link
                key={item.id}
                to={sectionLink(item.id)}
                className="mobile-menu__link"
                style={{ animationDelay: `${60 + i * 40}ms` }}
                onClick={() => setMenuOpen(false)}
              >
                {t(item.label)}
              </Link>
            ))}
          </nav>
          <LanguageSwitcher className="mobile-menu__lang" />
          <button
            type="button"
            className="btn btn--brass btn--block"
            onClick={() => {
              setMenuOpen(false)
              openBooking()
            }}
          >
            {t('actions.bookRoom')}
          </button>
          <div className="mobile-menu__contacts">
            <a href={telHref(settings.phone)}>
              <Phone size={18} /> {settings.phone}
            </a>
            <div className="mobile-menu__social">
              {settings.telegram && (
                <a href={telegramHref(settings.telegram)} target="_blank" rel="noopener noreferrer" aria-label="Telegram">
                  <TelegramIcon size={20} />
                </a>
              )}
              {settings.instagram && (
                <a href={instagramHref(settings.instagram)} target="_blank" rel="noopener noreferrer" aria-label="Instagram">
                  <InstagramIcon size={20} />
                </a>
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  )
}
