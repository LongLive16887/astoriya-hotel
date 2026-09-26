import { useTranslation } from 'react-i18next'
import { Clock, Mail, MapPin, MessageCircle, Navigation, Phone } from 'lucide-react'
import { InstagramIcon, TelegramIcon, WhatsAppIcon } from '../../components/BrandIcons'
import { useContent } from '../../content/context'
import { tr } from '../../content/localized'
import { useLang } from '../../i18n/useLang'
import {
  googleDirectionsHref,
  handleLabel,
  instagramHref,
  safeHref,
  safeMapEmbed,
  telegramHref,
  telHref,
  whatsappHref,
  yandexMapsHref,
} from '../../lib/links'
import './Location.css'

export function Location() {
  const { t } = useTranslation()
  const lang = useLang()
  const { settings } = useContent()
  const { lat, lng } = settings.location
  const embed = safeMapEmbed(settings.mapEmbedUrl)
  const googleHref = settings.mapUrl ? safeHref(settings.mapUrl) : googleDirectionsHref(lat, lng)

  return (
    <section id="contacts" className="section section--dark location" aria-labelledby="contacts-title">
      <div className="container location__inner">
        <div className="location__info">
          <p className="eyebrow reveal">{t('location.eyebrow')}</p>
          <h2 id="contacts-title" className="h-section reveal">
            {t('location.title')}
          </h2>
          <p className="lead reveal">{t('location.subtitle')}</p>

          <ul className="location__list reveal">
            <li>
              <MapPin />
              <div>
                <span className="location__label">{t('location.address')}</span>
                <span>{tr(settings.address, lang)}</span>
              </div>
            </li>
            <li>
              <Phone />
              <div>
                <span className="location__label">{t('location.phone')}</span>
                <a href={telHref(settings.phone)}>{settings.phone}</a>
                {settings.phone2 && <a href={telHref(settings.phone2)}>{settings.phone2}</a>}
              </div>
            </li>
            {settings.email && (
              <li>
                <Mail />
                <div>
                  <span className="location__label">{t('location.email')}</span>
                  <a href={`mailto:${settings.email}`}>{settings.email}</a>
                </div>
              </li>
            )}
            <li>
              <Clock />
              <div>
                <span className="location__label">{t('location.hours')}</span>
                <span>{t('location.hoursValue', { checkIn: settings.checkIn, checkOut: settings.checkOut })}</span>
              </div>
            </li>
            {(settings.telegram || settings.instagram || settings.whatsapp) && (
              <li>
                <MessageCircle />
                <div>
                  <span className="location__label">{t('location.messengers')}</span>
                  <div className="location__social">
                    {settings.telegram && (
                      <a href={telegramHref(settings.telegram)} target="_blank" rel="noopener noreferrer">
                        <TelegramIcon size={18} />
                        {handleLabel(settings.telegram)}
                      </a>
                    )}
                    {settings.instagram && (
                      <a href={instagramHref(settings.instagram)} target="_blank" rel="noopener noreferrer">
                        <InstagramIcon size={18} />
                        {handleLabel(settings.instagram)}
                      </a>
                    )}
                    {settings.whatsapp && (
                      <a href={whatsappHref(settings.whatsapp)} target="_blank" rel="noopener noreferrer">
                        <WhatsAppIcon size={18} />
                        WhatsApp
                      </a>
                    )}
                  </div>
                </div>
              </li>
            )}
          </ul>

          <div className="location__actions reveal">
            <a className="btn btn--brass" href={googleHref} target="_blank" rel="noopener noreferrer">
              <Navigation />
              {t('location.googleMaps')}
            </a>
            <a className="btn btn--outline-light" href={yandexMapsHref(lat, lng)} target="_blank" rel="noopener noreferrer">
              {t('location.yandexMaps')}
            </a>
          </div>
        </div>

        <div className="location__map reveal">
          {embed ? (
            <iframe
              title={t('location.mapTitle', { name: settings.hotelName })}
              src={embed}
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              allowFullScreen
            />
          ) : (
            <a className="location__map-fallback" href={googleHref} target="_blank" rel="noopener noreferrer">
              <MapPin />
              {tr(settings.address, lang)}
            </a>
          )}
        </div>
      </div>
    </section>
  )
}
