import { useTranslation } from 'react-i18next'
import { LogoMark } from './Logo'
import './Splash.css'

/** Shown while the first content loads; matches the static splash in index.html. */
export function Splash() {
  const { t } = useTranslation()
  return (
    <div className="splash" role="status" aria-label={t('a11y.loading')}>
      <LogoMark className="splash__mark" />
    </div>
  )
}
