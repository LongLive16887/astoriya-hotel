import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Mail, MapPin, Phone } from 'lucide-react'
import { Logo } from '../../components/Logo'
import { InstagramIcon, TelegramIcon, WhatsAppIcon } from '../../components/BrandIcons'
import { useContent } from '../../content/context'
import { tr } from '../../content/localized'
import { useLang } from '../../i18n/useLang'
import { instagramHref, telegramHref, telHref, whatsappHref } from '../../lib/links'
import { NAV_SECTIONS, sectionLink } from './nav'
import './Footer.css'

export function Footer() {
  const { t } = useTranslation()
  const lang = useLang()
  const { settings } = useContent()
  const year = new Date().getFullYear()

  return (
    <footer className="site-footer">
      <div className="container">
        <div className="site-footer__grid">
          <div className="site-footer__brand">
            <Link to="/" aria-label={t('a11y.home')}>
              <Logo />
            </Link>
            <p>{t('footer.tagline')}</p>
            <div className="site-footer__social">
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
              {settings.whatsapp && (
                <a href={whatsappHref(settings.whatsapp)} target="_blank" rel="noopener noreferrer" aria-label="WhatsApp">
                  <WhatsAppIcon size={20} />
                </a>
              )}
            </div>
          </div>

          <nav className="site-footer__col" aria-label={t('footer.navigation')}>
            <h2 className="site-footer__title">{t('footer.navigation')}</h2>
            <ul>
              {NAV_SECTIONS.map((item) => (
                <li key={item.id}>
                  <Link to={sectionLink(item.id)}>{t(item.label)}</Link>
                </li>
              ))}
              <li>
                <Link to="/news">{t('nav.news')}</Link>
              </li>
            </ul>
          </nav>

          <div className="site-footer__col">
            <h2 className="site-footer__title">{t('footer.contacts')}</h2>
            <ul className="site-footer__contacts">
              <li>
                <MapPin size={18} />
                <span>{tr(settings.address, lang)}</span>
              </li>
              <li>
                <Phone size={18} />
                <a href={telHref(settings.phone)}>{settings.phone}</a>
              </li>
              {settings.phone2 && (
                <li>
                  <Phone size={18} />
                  <a href={telHref(settings.phone2)}>{settings.phone2}</a>
                </li>
              )}
              {settings.email && (
                <li>
                  <Mail size={18} />
                  <a href={`mailto:${settings.email}`}>{settings.email}</a>
                </li>
              )}
            </ul>
          </div>
        </div>

        <div className="site-footer__bottom">
          <p>
            © {year} {settings.hotelName}. {t('footer.rights')}
          </p>
        </div>
      </div>
    </footer>
  )
}
