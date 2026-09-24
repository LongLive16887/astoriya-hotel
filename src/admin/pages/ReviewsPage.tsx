import { useState } from 'react'
import { ArrowDown, ArrowUp, MessageSquareQuote, Pencil, Plus, Star, Trash2, X } from 'lucide-react'
import { Dialog } from '../../components/Dialog'
import { emptyLocalized, tr } from '../../content/localized'
import type { Review } from '../../content/types'
import { randomId } from '../../lib/ids'
import { errorMessage, useConfirm, useToast } from '../components/feedback'
import { Field, LocalizedField } from '../components/LocalizedField'
import { DefaultsNotice, EmptyState, PageHeader, Spinner } from '../components/PageHeader'
import { Switch } from '../components/Switch'
import { moveItem, mutateList, removeItem, upsertItem, useContentDoc } from '../lib/content'

const newReview = (): Review => ({
  id: '',
  visible: true,
  author: emptyLocalized(),
  origin: emptyLocalized(),
  text: emptyLocalized(),
  rating: 5,
  source: '',
  date: new Date().toISOString().slice(0, 7),
})

export function ReviewsPage() {
  const { data: reviews, exists, loading } = useContentDoc('reviews')
  const toast = useToast()
  const confirm = useConfirm()
  const [editing, setEditing] = useState<Review | null>(null)

  const change = async (mutate: (items: Review[]) => Review[], success?: string) => {
    try {
      await mutateList('reviews', mutate)
      if (success) toast.success(success)
      return true
    } catch (e) {
      toast.error(errorMessage(e))
      return false
    }
  }

  const remove = async (review: Review) => {
    const ok = await confirm({ title: `Удалить отзыв ${tr(review.author, 'ru')}?`, confirmLabel: 'Удалить', danger: true })
    if (ok) await change((items) => removeItem(items, review.id), 'Отзыв удалён')
  }

  return (
    <div className="a-page a-page--narrow">
      <PageHeader
        title="Отзывы гостей"
        description="Добавляйте настоящие отзывы — например, с Booking.com, Google или из переписки с гостями (с их согласия)."
        actions={
          <button type="button" className="a-btn a-btn--primary" onClick={() => setEditing(newReview())}>
            <Plus size={16} /> Добавить отзыв
          </button>
        }
      />
      {!loading && !exists && <DefaultsNotice what="показаны отзывы" />}

      {loading ? (
        <Spinner />
      ) : reviews.length === 0 ? (
        <EmptyState icon={<MessageSquareQuote />} title="Отзывов пока нет" text="Без отзывов раздел на сайте скрывается." />
      ) : (
        <ul className="a-list">
          {reviews.map((review, i) => (
            <li key={review.id} className={`a-row ${review.visible ? '' : 'is-hidden'}`}>
              <div className="a-row__main">
                <button type="button" className="a-row__title a-link-button" onClick={() => setEditing(review)}>
                  {tr(review.author, 'ru') || 'Без имени'}
                  {review.rating > 0 && <span className="a-rating">{'★'.repeat(review.rating)}</span>}
                </button>
                <span className="a-row__meta">{tr(review.text, 'ru')}</span>
              </div>
              <div className="a-row__actions">
                <Switch
                  checked={review.visible}
                  hideLabel
                  label="Показывать на сайте"
                  onChange={(visible) => change((items) => items.map((r) => (r.id === review.id ? { ...r, visible } : r)))}
                />
                <button type="button" className="a-icon-btn" disabled={i === 0} onClick={() => change((items) => moveItem(items, review.id, -1))} aria-label="Выше">
                  <ArrowUp size={18} />
                </button>
                <button
                  type="button"
                  className="a-icon-btn"
                  disabled={i === reviews.length - 1}
                  onClick={() => change((items) => moveItem(items, review.id, 1))}
                  aria-label="Ниже"
                >
                  <ArrowDown size={18} />
                </button>
                <button type="button" className="a-icon-btn" onClick={() => setEditing(review)} aria-label="Редактировать">
                  <Pencil size={18} />
                </button>
                <button type="button" className="a-icon-btn a-icon-btn--danger" onClick={() => remove(review)} aria-label="Удалить">
                  <Trash2 size={18} />
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      <Dialog open={editing !== null} onClose={() => setEditing(null)} labelledBy="a-review-title" className="a-modal">
        {editing && (
          <ReviewForm
            key={editing.id || 'new'}
            initial={editing}
            onClose={() => setEditing(null)}
            onSave={async (review) => {
              const isNew = !review.id
              const saved = await change(
                (items) => (isNew ? [{ ...review, id: randomId(10) }, ...items] : upsertItem(items, review)),
                isNew ? 'Отзыв добавлен' : 'Отзыв сохранён',
              )
              if (saved) setEditing(null)
            }}
          />
        )}
      </Dialog>
    </div>
  )
}

function ReviewForm({ initial, onClose, onSave }: { initial: Review; onClose: () => void; onSave: (r: Review) => Promise<void> }) {
  const toast = useToast()
  const [review, setReview] = useState(initial)
  const [saving, setSaving] = useState(false)
  const set = <K extends keyof Review>(key: K, value: Review[K]) => setReview((r) => ({ ...r, [key]: value }))

  const submit = async () => {
    if (!(review.text.ru || review.text.uz || review.text.en).trim()) {
      toast.error('Добавьте текст отзыва хотя бы на одном языке')
      return
    }
    setSaving(true)
    await onSave(review)
    setSaving(false)
  }

  return (
    <div className="a-modal__body">
      <header className="a-modal__header">
        <h2 id="a-review-title">{initial.id ? 'Редактировать отзыв' : 'Новый отзыв'}</h2>
        <button type="button" className="a-icon-btn" onClick={onClose} aria-label="Закрыть">
          <X size={20} />
        </button>
      </header>
      <LocalizedField
        label="Текст отзыва"
        value={review.text}
        onChange={(v) => set('text', v)}
        multiline
        rows={5}
        maxLength={1200}
        hint="Можно заполнить только язык оригинала — на остальных языках сайт покажет его же."
      />
      <div className="a-grid-2">
        <LocalizedField label="Имя гостя" value={review.author} onChange={(v) => set('author', v)} maxLength={60} />
        <LocalizedField label="Откуда гость" value={review.origin} onChange={(v) => set('origin', v)} placeholder="Путешественница из Финляндии" maxLength={80} />
      </div>
      <div className="a-grid-3">
        <Field label="Оценка">
          <select className="a-input" value={review.rating} onChange={(e) => set('rating', Number(e.target.value))}>
            <option value={0}>Без оценки</option>
            {[5, 4, 3, 2, 1].map((n) => (
              <option key={n} value={n}>
                {'★'.repeat(n)} {n}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Источник" hint="Booking.com, Google…">
          <input className="a-input" value={review.source} maxLength={40} onChange={(e) => set('source', e.target.value)} />
        </Field>
        <Field label="Месяц отзыва">
          <input className="a-input" type="month" value={review.date} onChange={(e) => set('date', e.target.value)} />
        </Field>
      </div>
      <Switch checked={review.visible} onChange={(v) => set('visible', v)} label="Показывать на сайте" />
      <footer className="a-modal__footer">
        <button type="button" className="a-btn" onClick={onClose}>
          Отмена
        </button>
        <button type="button" className="a-btn a-btn--primary" onClick={submit} disabled={saving}>
          <Star size={16} /> {saving ? 'Сохраняем…' : 'Сохранить'}
        </button>
      </footer>
    </div>
  )
}
