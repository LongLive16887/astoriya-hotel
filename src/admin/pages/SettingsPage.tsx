import { useState } from 'react'
import { ArrowDown, ArrowUp, Plus, Save, Trash2 } from 'lucide-react'
import { emptyLocalized } from '../../content/localized'
import type { Highlight, SiteSettings } from '../../content/types'
import { safeMapEmbed } from '../../lib/links'
import { errorMessage, useToast } from '../components/feedback'
import { ImageField } from '../components/ImageFields'
import { Field, LocalizedField } from '../components/LocalizedField'
import { PageHeader, Spinner } from '../components/PageHeader'
import { SaveBar } from '../components/SaveBar'
import { useUnsavedChanges } from '../components/useUnsavedChanges'
import { saveSettings, useContentDoc } from '../lib/content'
import { mergeEdits } from '../lib/merge'

export function SettingsPage() {
  const { data, loading, error } = useContentDoc('settings')
  if (loading) return <Spinner />
  return <SettingsForm initial={data} error={error} />
}

function SettingsForm({ initial, error }: { initial: SiteSettings; error: string | null }) {
  const toast = useToast()
  // The version the form started from (or last saved); unsaved changes are measured against it.
  const [saved, setSaved] = useState(initial)
  const [s, setS] = useState(initial)
  const [saving, setSaving] = useState(false)
  const dirty = JSON.stringify(s) !== JSON.stringify(saved)
  useUnsavedChanges(dirty)

  const set = <K extends keyof SiteSettings>(key: K, value: SiteSettings[K]) => setS((prev) => ({ ...prev, [key]: value }))
  const setIn = <K extends 'hero' | 'about' | 'spa', F extends keyof SiteSettings[K]>(group: K, field: F, value: SiteSettings[K][F]) =>
    setS((prev) => ({ ...prev, [group]: { ...prev[group], [field]: value } }))

  const setHighlight = (index: number, highlight: Highlight) =>
    set('highlights', s.highlights.map((h, i) => (i === index ? highlight : h)))
  const moveHighlight = (index: number, delta: -1 | 1) => {
    const next = [...s.highlights]
    const target = index + delta
    if (target < 0 || target >= next.length) return
    ;[next[index], next[target]] = [next[target], next[index]]
    set('highlights', next)
  }

  const save = async () => {
    if (!s.phone.trim()) {
      toast.error('Укажите основной телефон — он используется для звонков с сайта')
      return
    }
    if (s.mapEmbedUrl.trim() && !safeMapEmbed(s.mapEmbedUrl)) {
      toast.error('Ссылка для встраивания карты должна начинаться с https://www.google.com/maps/embed')
      return
    }
    setSaving(true)
    try {
      const stored = await saveSettings(saved, s)
      setSaved(stored)
      // Show what is stored now, keeping anything typed while the save was in flight.
      setS((latest) => mergeEdits(stored, s, latest))
      toast.success('Настройки сохранены — сайт обновится у гостей при следующем открытии')
    } catch (e) {
      toast.error(errorMessage(e))
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="a-page a-page--narrow">
      <PageHeader
        title="Настройки сайта"
        description="Контакты, тексты главной страницы и фото. Тексты заполняются на трёх языках."
        actions={
          <button type="button" className="a-btn a-btn--primary" onClick={save} disabled={saving || !dirty}>
            <Save size={16} /> {saving ? 'Сохраняем…' : 'Сохранить'}
          </button>
        }
      />
      {error && <p className="a-alert a-alert--danger">{error}</p>}

      <div className="a-form">
        <section className="a-card">
          <h2 className="a-card__title">Контакты</h2>
          <div className="a-grid-2">
            <Field label="Название отеля">
              <input className="a-input" value={s.hotelName} onChange={(e) => set('hotelName', e.target.value)} />
            </Field>
            <Field label="Email" hint="Необязательно">
              <input className="a-input" type="email" value={s.email} onChange={(e) => set('email', e.target.value)} />
            </Field>
            <Field label="Телефон" hint="Так он будет показан на сайте, например +998 55 705 00 10">
              <input className="a-input" type="tel" value={s.phone} onChange={(e) => set('phone', e.target.value)} />
            </Field>
            <Field label="Второй телефон" hint="Необязательно">
              <input className="a-input" type="tel" value={s.phone2} onChange={(e) => set('phone2', e.target.value)} />
            </Field>
            <Field label="Telegram" hint="Имя пользователя без @">
              <div className="a-input-group">
                <span className="a-input-group__addon">t.me/</span>
                <input className="a-input" value={s.telegram} onChange={(e) => set('telegram', e.target.value.replace(/^@/, ''))} />
              </div>
            </Field>
            <Field label="Instagram" hint="Имя пользователя без @">
              <div className="a-input-group">
                <span className="a-input-group__addon">instagram.com/</span>
                <input className="a-input" value={s.instagram} onChange={(e) => set('instagram', e.target.value.replace(/^@/, ''))} />
              </div>
            </Field>
            <Field label="WhatsApp" hint="Номер в международном формате; пусто — не показывать">
              <input className="a-input" type="tel" value={s.whatsapp} onChange={(e) => set('whatsapp', e.target.value)} />
            </Field>
            <div className="a-grid-2">
              <Field label="Заезд с">
                <input className="a-input" type="time" value={s.checkIn} onChange={(e) => set('checkIn', e.target.value)} />
              </Field>
              <Field label="Выезд до">
                <input className="a-input" type="time" value={s.checkOut} onChange={(e) => set('checkOut', e.target.value)} />
              </Field>
            </div>
          </div>
          <LocalizedField label="Адрес" value={s.address} onChange={(v) => set('address', v)} />
        </section>

        <section className="a-card">
          <h2 className="a-card__title">Карта</h2>
          <Field label="Ссылка на отель в Google Maps" hint="Открывается по кнопке «Google Maps».">
            <input className="a-input" type="url" value={s.mapUrl} onChange={(e) => set('mapUrl', e.target.value)} />
          </Field>
          <Field
            label="Карта для встраивания (src)"
            hint="Google Maps → «Поделиться» → «Встраивание карт» → скопируйте адрес из src=&quot;…&quot;."
          >
            <input className="a-input" type="url" value={s.mapEmbedUrl} onChange={(e) => set('mapEmbedUrl', e.target.value)} />
          </Field>
          <div className="a-grid-2">
            <Field label="Широта" hint="Для кнопки «Яндекс Карты»">
              <input
                className="a-input"
                type="number"
                step="0.000001"
                value={s.location.lat}
                onChange={(e) => set('location', { ...s.location, lat: Number(e.target.value) })}
              />
            </Field>
            <Field label="Долгота">
              <input
                className="a-input"
                type="number"
                step="0.000001"
                value={s.location.lng}
                onChange={(e) => set('location', { ...s.location, lng: Number(e.target.value) })}
              />
            </Field>
          </div>
        </section>

        <section className="a-card">
          <h2 className="a-card__title">Главный экран</h2>
          <LocalizedField
            label="Заголовок"
            value={s.hero.title}
            onChange={(v) => setIn('hero', 'title', v)}
            multiline
            rows={3}
            hint="Каждая фраза — с новой строки. Последняя строка выделяется золотым курсивом."
          />
          <LocalizedField label="Подзаголовок" value={s.hero.subtitle} onChange={(v) => setIn('hero', 'subtitle', v)} multiline rows={3} />
          <div className="a-grid-2">
            <ImageField label="Главное фото (в арке)" value={s.hero.image} onChange={(v) => setIn('hero', 'image', v)} hint="Лучше вертикальное фото 3:4." />
            <ImageField label="Круглое фото" value={s.hero.secondaryImage} onChange={(v) => setIn('hero', 'secondaryImage', v)} optional />
          </div>
        </section>

        <section className="a-card">
          <h2 className="a-card__title">Об отеле</h2>
          <LocalizedField label="Заголовок" value={s.about.title} onChange={(v) => setIn('about', 'title', v)} />
          <LocalizedField
            label="Текст"
            value={s.about.text}
            onChange={(v) => setIn('about', 'text', v)}
            multiline
            rows={8}
            hint="Абзацы разделяйте пустой строкой."
          />
          <div className="a-grid-2">
            <ImageField label="Основное фото" value={s.about.image} onChange={(v) => setIn('about', 'image', v)} />
            <ImageField label="Фото в арке" value={s.about.secondaryImage} onChange={(v) => setIn('about', 'secondaryImage', v)} optional />
          </div>

          <div className="a-field">
            <span className="a-label">Цифры под текстом</span>
            <p className="a-hint">Короткое значение (24/7, 8, SPA) и подпись к нему. Лучше всего смотрятся 3–4 пункта.</p>
          </div>
          {s.highlights.map((h, i) => (
            <div key={i} className="a-highlight-row">
              <Field label="Значение">
                <input className="a-input" value={h.value} maxLength={8} onChange={(e) => setHighlight(i, { ...h, value: e.target.value })} />
              </Field>
              <LocalizedField label="Подпись" value={h.label} onChange={(label) => setHighlight(i, { ...h, label })} maxLength={40} />
              <div className="a-row__actions">
                <button type="button" className="a-icon-btn" disabled={i === 0} onClick={() => moveHighlight(i, -1)} aria-label="Выше">
                  <ArrowUp size={18} />
                </button>
                <button type="button" className="a-icon-btn" disabled={i === s.highlights.length - 1} onClick={() => moveHighlight(i, 1)} aria-label="Ниже">
                  <ArrowDown size={18} />
                </button>
                <button
                  type="button"
                  className="a-icon-btn a-icon-btn--danger"
                  onClick={() => set('highlights', s.highlights.filter((_, j) => j !== i))}
                  aria-label="Удалить"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            </div>
          ))}
          {s.highlights.length < 6 && (
            <button
              type="button"
              className="a-btn a-btn--sm a-self-start"
              onClick={() => set('highlights', [...s.highlights, { value: '', label: emptyLocalized() }])}
            >
              <Plus size={16} /> Добавить пункт
            </button>
          )}
        </section>

        <section className="a-card">
          <h2 className="a-card__title">SPA</h2>
          <LocalizedField label="Заголовок" value={s.spa.title} onChange={(v) => setIn('spa', 'title', v)} />
          <LocalizedField label="Текст" value={s.spa.text} onChange={(v) => setIn('spa', 'text', v)} multiline rows={4} />
          <ImageField label="Фото" value={s.spa.image} onChange={(v) => setIn('spa', 'image', v)} />
        </section>
      </div>

      {dirty && (
        <SaveBar
          saving={saving}
          onSave={save}
          onReset={() => {
            // Discard the edits and show what is stored now.
            setSaved(initial)
            setS(initial)
          }}
        />
      )}
    </div>
  )
}
