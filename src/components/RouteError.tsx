import { useEffect } from 'react'
import { useRouteError } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import type { Lang } from '../content/types'
import { LogoMark } from './Logo'
import './RouteError.css'

/**
 * Replaces React Router's developer screen when a page fails to render or its code fails
 * to download (for example, a new release went out while the connection is poor).
 */
export function RouteError({ lang }: { lang?: Lang }) {
  const { t } = useTranslation(undefined, { lng: lang })
  const error = useRouteError()

  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <main className="route-error">
      <div className="route-error__arch arch" aria-hidden="true">
        <LogoMark />
      </div>
      <h1 className="h-section">{t('errorPage.title')}</h1>
      <p className="lead">{t('errorPage.text')}</p>
      <button type="button" className="btn btn--primary" onClick={() => window.location.reload()}>
        {t('errorPage.reload')}
      </button>
    </main>
  )
}
