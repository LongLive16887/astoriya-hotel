import type { ReactNode } from 'react'

interface PageHeaderProps {
  title: string
  description?: ReactNode
  actions?: ReactNode
  back?: ReactNode
}

export function PageHeader({ title, description, actions, back }: PageHeaderProps) {
  return (
    <header className="a-page-header">
      <div className="a-page-header__text">
        {back}
        <h1 className="a-page-title">{title}</h1>
        {description && <p className="a-page-description">{description}</p>}
      </div>
      {actions && <div className="a-page-header__actions">{actions}</div>}
    </header>
  )
}

export function EmptyState({ icon, title, text, action }: { icon?: ReactNode; title: string; text?: string; action?: ReactNode }) {
  return (
    <div className="a-empty">
      {icon}
      <strong>{title}</strong>
      {text && <p>{text}</p>}
      {action}
    </div>
  )
}

export function Spinner({ label = 'Загрузка…' }: { label?: string }) {
  return (
    <div className="a-spinner" role="status">
      <span className="a-spinner__circle" aria-hidden="true" />
      <span>{label}</span>
    </div>
  )
}

/** Notice for sections that still show the built-in content. */
export function DefaultsNotice({ what }: { what: string }) {
  return (
    <p className="a-alert a-alert--info">
      Сейчас на сайте {what} по умолчанию. Они сохранятся в базе при первом изменении.
    </p>
  )
}
