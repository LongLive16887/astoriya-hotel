import { useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { useContent } from '../content/context'

/** Sets the page title and meta description; without a title the home page texts are used. */
export function useDocumentMeta(title?: string, description?: string) {
  const { t } = useTranslation()
  const { settings } = useContent()

  useEffect(() => {
    document.title = title ? `${title} — ${settings.hotelName}` : t('meta.title')
    document
      .querySelector('meta[name="description"]')
      ?.setAttribute('content', description?.trim() || t('meta.description'))
  }, [title, description, settings.hotelName, t])
}
