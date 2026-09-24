import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import { LANGS, type Lang } from '../content/types'
import { glueDashes, isLang } from '../content/localized'
import en from './en'
import ru from './ru'
import uz from './uz'

const STORAGE_KEY = 'astoria:lang'

// Visitors from neighbouring countries usually read Russian better than English.
const RUSSIAN_READERS = ['kk', 'ky', 'tg', 'tk', 'be']

function storedLang(): Lang | null {
  try {
    const value = localStorage.getItem(STORAGE_KEY)
    return isLang(value) ? value : null
  } catch {
    return null
  }
}

/** ?lang= in the URL, then the saved choice, then the browser languages, then English. */
export function detectLanguage(): Lang {
  const fromUrl = new URLSearchParams(window.location.search).get('lang')
  if (isLang(fromUrl)) return fromUrl
  const saved = storedLang()
  if (saved) return saved
  for (const tag of navigator.languages ?? [navigator.language]) {
    const base = tag.toLowerCase().split('-')[0]
    if (isLang(base)) return base
    if (RUSSIAN_READERS.includes(base)) return 'ru'
  }
  return 'en'
}

export function setLanguage(lang: Lang) {
  void i18n.changeLanguage(lang)
  try {
    localStorage.setItem(STORAGE_KEY, lang)
  } catch {
    // Storage can be unavailable (private mode); the choice then lasts for this visit only.
  }
}

i18n.on('languageChanged', (lng) => {
  document.documentElement.lang = lng
})

void i18n
  .use(initReactI18next)
  .use({ type: 'postProcessor', name: 'glueDashes', process: (value: string) => glueDashes(value) })
  .init({
    resources: {
      uz: { translation: uz },
      ru: { translation: ru },
      en: { translation: en },
    },
    lng: detectLanguage(),
    fallbackLng: 'en',
    supportedLngs: LANGS,
    interpolation: { escapeValue: false },
    postProcess: ['glueDashes'],
  })

document.documentElement.lang = i18n.language

export default i18n
