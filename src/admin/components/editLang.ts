import { createContext, useContext } from 'react'
import type { Lang } from '../../content/types'

export interface EditLangState {
  lang: Lang
  setLang: (lang: Lang) => void
}

/** Language currently being edited; shared by all translated fields of a form. */
export const EditLangContext = createContext<EditLangState>({ lang: 'ru', setLang: () => {} })

export const useEditLang = () => useContext(EditLangContext)

export const LANG_NAMES = { uz: 'Узбекский', ru: 'Русский', en: 'Английский' } as const
