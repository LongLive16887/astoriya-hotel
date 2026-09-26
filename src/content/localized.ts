import { LANGS, type Lang, type Localized } from './types'

export const emptyLocalized = (): Localized => ({ uz: '', ru: '', en: '' })

/** Order in which languages are tried when a translation is missing. */
const FALLBACK: Record<Lang, readonly Lang[]> = {
  uz: ['uz', 'ru', 'en'],
  ru: ['ru', 'en', 'uz'],
  en: ['en', 'ru', 'uz'],
}

/** Keeps a dash on the same line as the word before it, as Russian typography requires. */
export const glueDashes = (text: string) => text.replace(/ ([—–])/g, '\u00a0$1')

/** Picks the text for `lang`, falling back to other languages when it is empty. */
export function tr(value: Partial<Localized> | null | undefined, lang: Lang): string {
  if (!value) return ''
  for (const l of FALLBACK[lang]) {
    const text = value[l]
    if (text && text.trim()) return glueDashes(text)
  }
  return ''
}

export function isLang(value: unknown): value is Lang {
  return typeof value === 'string' && (LANGS as readonly string[]).includes(value)
}

/** Splits multi-paragraph text on blank lines. */
export function paragraphs(text: string): string[] {
  return text
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean)
}
