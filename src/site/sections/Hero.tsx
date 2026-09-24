import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useContent } from '../../content/context'
import { tr } from '../../content/localized'
import { useLang } from '../../i18n/useLang'
import { useOpenBooking } from '../booking/context'
import { sectionLink } from '../layout/nav'
import './Hero.css'

// React 18 does not know the camelCase prop yet, so pass the attribute as is.
const highPriority = { fetchpriority: 'high' } as Record<string, string>

export function Hero() {
  const { t } = useTranslation()
  const lang = useLang()
  const { settings } = useContent()
  const openBooking = useOpenBooking()

  const lines = tr(settings.hero.title, lang)
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
  // The last line is set in italic brass, like a signature.
  const accent = lines.length > 1 ? lines[lines.length - 1] : null
  const plain = accent ? lines.slice(0, -1) : lines
  const { lat, lng } = settings.location

  return (
    <section className="hero" aria-labelledby="hero-title">
      <div className="hero__pattern" aria-hidden="true" />
      <div className="container hero__inner">
        <div className="hero__content">
          <p className="eyebrow eyebrow--light hero__eyebrow">{t('hero.eyebrow')}</p>
          <h1 id="hero-title" className="h-display hero__title">
            {plain.map((line, i) => (
              <span key={i} className="hero__line">
                {line}
              </span>
            ))}
            {accent && <span className="hero__line accent">{accent}</span>}
          </h1>
          <p className="lead hero__subtitle">{tr(settings.hero.subtitle, lang)}</p>
          <div className="hero__actions">
            <button type="button" className="btn btn--brass" onClick={() => openBooking()}>
              {t('actions.bookRoom')}
            </button>
            <Link className="btn btn--outline-light" to={sectionLink('rooms')}>
              {t('actions.viewRooms')}
            </Link>
          </div>
        </div>

        <div className="hero__media">
          <div className="hero__arch arch">
            <img src={settings.hero.image} alt={settings.hotelName} width={576} height={768} {...highPriority} />
          </div>
          {settings.hero.secondaryImage && (
            <div className="hero__badge">
              <img src={settings.hero.secondaryImage} alt="" loading="lazy" />
            </div>
          )}
          <p className="hero__coords" aria-hidden="true">
            Samarkand · {lat.toFixed(2)}° N {lng.toFixed(2)}° E
          </p>
        </div>
      </div>
    </section>
  )
}
