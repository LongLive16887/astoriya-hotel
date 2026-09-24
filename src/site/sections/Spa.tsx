import type { CSSProperties } from 'react'
import { useTranslation } from 'react-i18next'
import { Droplets, Flame, Waves } from 'lucide-react'
import { Img } from '../../components/Img'
import { SERVICE_ICON_COMPONENTS } from '../../components/icons'
import { useContent } from '../../content/context'
import { tr } from '../../content/localized'
import { useLang } from '../../i18n/useLang'
import { useOpenBooking } from '../booking/context'
import './Spa.css'

export function Spa() {
  const { t } = useTranslation()
  const lang = useLang()
  const { settings, services } = useContent()
  const openBooking = useOpenBooking()
  const visible = services.filter((s) => s.visible)
  const title = tr(settings.spa.title, lang)

  return (
    <section id="spa" className="section section--dark spa" aria-labelledby="spa-title">
      <div className="container">
        <div className="spa__feature">
          <div className="spa__media reveal">
            <div className="spa__arch arch">
              <Img src={settings.spa.image} alt={title} />
            </div>
          </div>
          <div className="spa__content">
            <p className="eyebrow reveal">{t('spa.eyebrow')}</p>
            <h2 id="spa-title" className="h-section reveal">
              {title}
            </h2>
            <p className="lead reveal">{tr(settings.spa.text, lang)}</p>
            <ul className="spa__points reveal">
              <li>
                <Waves />
                {t('spa.points.pool')}
              </li>
              <li>
                <Flame />
                {t('spa.points.sauna')}
              </li>
              <li>
                <Droplets />
                {t('spa.points.hammam')}
              </li>
            </ul>
            <button type="button" className="btn btn--brass reveal" onClick={() => openBooking()}>
              {t('actions.bookRoom')}
            </button>
          </div>
        </div>

        {visible.length > 0 && (
          <div className="spa__services">
            <div className="section-heading section-heading--center">
              <p className="eyebrow reveal">{t('spa.servicesEyebrow')}</p>
              <h2 className="h-section reveal">{t('spa.servicesTitle')}</h2>
            </div>
            <ul className="services-grid">
              {visible.map((service, i) => {
                const Icon = SERVICE_ICON_COMPONENTS[service.icon]
                return (
                  <li key={service.id} className="service reveal" style={{ '--reveal-delay': `${(i % 4) * 70}ms` } as CSSProperties}>
                    <span className="service__icon">
                      <Icon strokeWidth={1.4} />
                    </span>
                    <h3 className="service__title">{tr(service.title, lang)}</h3>
                    {tr(service.text, lang) && <p>{tr(service.text, lang)}</p>}
                  </li>
                )
              })}
            </ul>
          </div>
        )}
      </div>
    </section>
  )
}
