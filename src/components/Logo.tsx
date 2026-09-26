import './Logo.css'

/** The "AA" monogram from the hotel sign, traced from the original logo. */
export const LOGO_MARK_PATH =
  'M0 100L11.2 100L26.6 67.3L35.8 67.3L40.4 57.4L31.4 57.4L48.4 21.5L64.3 55.4L75.4 55.4L49.7 0L47.3 0ZM22.5 100L33.6 100L49 67.3L92.3 67.3L107.8 100L118.6 100L72.1 0L69.6 0L60.5 19.1L66.3 31L70.9 21.5L87.6 57.4L53.8 57.4L58.6 47L52.8 35.4ZM70.9 69.3L85.5 100L96.2 100L82.2 69.3Z'

export function LogoMark({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 118.6 100" aria-hidden="true" focusable="false">
      <path fill="currentColor" d={LOGO_MARK_PATH} />
    </svg>
  )
}

export function Logo({ compact = false }: { compact?: boolean }) {
  return (
    <span className="logo">
      <LogoMark className="logo__mark" />
      {!compact && (
        <span className="logo__text">
          <span className="logo__name">Astoria</span>
          <span className="logo__sub">Boutique &amp; SPA</span>
        </span>
      )}
    </span>
  )
}
