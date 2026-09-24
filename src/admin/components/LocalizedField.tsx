import { useId, useState, type ReactNode } from 'react'
import { LANGS, type Lang, type Localized } from '../../content/types'
import { EditLangContext, LANG_NAMES, useEditLang } from './editLang'

export function EditLangProvider({ children }: { children: ReactNode }) {
  const [lang, setLang] = useState<Lang>('ru')
  return <EditLangContext.Provider value={{ lang, setLang }}>{children}</EditLangContext.Provider>
}

interface LocalizedFieldProps {
  label: string
  value: Localized
  onChange: (value: Localized) => void
  multiline?: boolean
  rows?: number
  hint?: ReactNode
  placeholder?: string
  maxLength?: number
}

/**
 * A text field translated into the three site languages. The UZ / RU / EN tabs are shared
 * by the whole form; a dot marks languages that are still empty (the site then shows another one).
 */
export function LocalizedField({ label, value, onChange, multiline, rows = 4, hint, placeholder, maxLength }: LocalizedFieldProps) {
  const { lang, setLang } = useEditLang()
  const id = useId()
  const inputId = `${id}-${lang}`
  const common = {
    id: inputId,
    lang,
    className: multiline ? 'a-input a-textarea' : 'a-input',
    value: value[lang],
    placeholder,
    maxLength,
  }

  return (
    <div className="a-field">
      <div className="a-field__top">
        <label className="a-label" htmlFor={inputId}>
          {label}
        </label>
        <div className="a-lang-tabs" role="group" aria-label={`Язык поля «${label}»`}>
          {LANGS.map((l) => {
            const empty = !value[l].trim()
            return (
              <button
                key={l}
                type="button"
                className={`a-lang-tab ${empty ? 'is-empty' : ''}`}
                aria-pressed={l === lang}
                title={`${LANG_NAMES[l]}${empty ? ' — не заполнено' : ''}`}
                onClick={() => setLang(l)}
              >
                {l.toUpperCase()}
              </button>
            )
          })}
        </div>
      </div>
      {multiline ? (
        <textarea {...common} rows={rows} onChange={(e) => onChange({ ...value, [lang]: e.target.value })} />
      ) : (
        <input {...common} type="text" onChange={(e) => onChange({ ...value, [lang]: e.target.value })} />
      )}
      {hint && <p className="a-hint">{hint}</p>}
    </div>
  )
}

/** Labelled wrapper for a non-translated input (the label wraps the control, the hint stays outside). */
export function Field({ label, hint, children }: { label: string; hint?: ReactNode; children: ReactNode }) {
  return (
    <div className="a-field">
      <label className="a-field__label">
        <span className="a-label">{label}</span>
        {children}
      </label>
      {hint && <p className="a-hint">{hint}</p>}
    </div>
  )
}
