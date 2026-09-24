import { useTranslation } from 'react-i18next'
import { isLang } from '../content/localized'
import type { Lang } from '../content/types'

/** Current site language; re-renders the component when it changes. */
export function useLang(): Lang {
  const { i18n } = useTranslation()
  return isLang(i18n.language) ? i18n.language : 'en'
}
