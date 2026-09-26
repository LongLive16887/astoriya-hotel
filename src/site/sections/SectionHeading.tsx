import type { ReactNode } from 'react'

interface SectionHeadingProps {
  id: string
  eyebrow: string
  title: ReactNode
  subtitle?: ReactNode
  center?: boolean
  className?: string
}

export function SectionHeading({ id, eyebrow, title, subtitle, center, className = '' }: SectionHeadingProps) {
  return (
    <div className={`section-heading ${center ? 'section-heading--center' : ''} ${className}`}>
      <p className="eyebrow reveal">{eyebrow}</p>
      <h2 id={id} className="h-section reveal">
        {title}
      </h2>
      {subtitle && <p className="lead reveal">{subtitle}</p>}
    </div>
  )
}
