import { Star } from 'lucide-react'
import { useTranslation } from 'react-i18next'

export function Stars({ value, size = 16 }: { value: number; size?: number }) {
  const { t } = useTranslation()
  if (value < 1) return null
  return (
    <span className="stars" role="img" aria-label={t('reviews.rating', { value })}>
      {Array.from({ length: 5 }, (_, i) => (
        <Star
          key={i}
          size={size}
          strokeWidth={1.5}
          fill={i < value ? 'currentColor' : 'none'}
          aria-hidden="true"
        />
      ))}
    </span>
  )
}
