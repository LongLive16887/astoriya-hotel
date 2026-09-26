import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { LogoMark } from '../../components/Logo'
import './pages.css'

interface NotFoundViewProps {
  title: string
  text: string
  children?: ReactNode
}

export function NotFoundView({ title, text, children }: NotFoundViewProps) {
  const { t } = useTranslation()
  return (
    <section className="page not-found">
      <div className="container not-found__inner">
        <div className="not-found__arch arch" aria-hidden="true">
          <LogoMark />
        </div>
        <h1 className="h-section">{title}</h1>
        <p className="lead">{text}</p>
        <div className="not-found__actions">
          <Link className="btn btn--primary" to="/">
            {t('actions.toHome')}
          </Link>
          {children}
        </div>
      </div>
    </section>
  )
}
