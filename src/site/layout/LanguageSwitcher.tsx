import { useTranslation } from 'react-i18next'
import { LANGS } from '../../content/types'
import { setLanguage } from '../../i18n'
import { useLang } from '../../i18n/useLang'

const LABELS = { uz: 'Oʻzbekcha', ru: 'Русский', en: 'English' } as const

export function LanguageSwitcher({ className = '' }: { className?: string }) {
  const { t } = useTranslation()
  const current = useLang()
  return (
    <div className={`lang-switch ${className}`} role="group" aria-label={t('a11y.language')}>
      {LANGS.map((lang) => (
        <button
          key={lang}
          type="button"
          lang={lang}
          className="lang-switch__option"
          aria-pressed={lang === current}
          title={LABELS[lang]}
          onClick={() => setLanguage(lang)}
        >
          {lang.toUpperCase()}
        </button>
      ))}
    </div>
  )
}
