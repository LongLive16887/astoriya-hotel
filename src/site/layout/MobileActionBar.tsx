import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Phone } from 'lucide-react'
import { TelegramIcon } from '../../components/BrandIcons'
import { useContent } from '../../content/context'
import { telegramHref, telHref } from '../../lib/links'
import { useOpenBooking } from '../booking/context'
import './MobileActionBar.css'

/** Call / message / book buttons pinned to the bottom of the screen on phones. */
export function MobileActionBar() {
  const { t } = useTranslation()
  const { settings } = useContent()
  const openBooking = useOpenBooking()
  const [visible, setVisible] = useState(() => window.scrollY > 420)

  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > 420)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <div className={`action-bar ${visible ? 'is-visible' : ''}`} aria-hidden={!visible}>
      <a className="action-bar__item" href={telHref(settings.phone)} tabIndex={visible ? 0 : -1}>
        <Phone size={20} />
        <span>{t('mobileBar.call')}</span>
      </a>
      {settings.telegram && (
        <a
          className="action-bar__item"
          href={telegramHref(settings.telegram)}
          target="_blank"
          rel="noopener noreferrer"
          tabIndex={visible ? 0 : -1}
        >
          <TelegramIcon size={20} />
          <span>{t('mobileBar.write')}</span>
        </a>
      )}
      <button type="button" className="btn btn--brass action-bar__book" onClick={() => openBooking()} tabIndex={visible ? 0 : -1}>
        {t('actions.book')}
      </button>
    </div>
  )
}
