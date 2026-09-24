import { useRef, useState } from 'react'
import { ArrowLeft, ArrowRight, Images, Library, Pencil, Trash2, Upload, X } from 'lucide-react'
import { Dialog } from '../../components/Dialog'
import { emptyLocalized, tr } from '../../content/localized'
import { GALLERY_CATEGORIES, type GalleryCategory, type GalleryImage } from '../../content/types'
import { randomId } from '../../lib/ids'
import ru from '../../i18n/ru'
import { errorMessage, useConfirm, useToast } from '../components/feedback'
import { ImageLibrary } from '../components/ImageLibrary'
import { LocalizedField } from '../components/LocalizedField'
import { DefaultsNotice, EmptyState, PageHeader, Spinner } from '../components/PageHeader'
import { moveItem, mutateList, removeItem, upsertItem, useContentDoc } from '../lib/content'
import { uploadImage } from '../lib/upload'

const CATEGORY_LABELS = ru.gallery.categories

export function GalleryPage() {
  const { data: gallery, exists, loading } = useContentDoc('gallery')
  const toast = useToast()
  const confirm = useConfirm()
  const [filter, setFilter] = useState<GalleryCategory | 'all'>('all')
  const [libraryOpen, setLibraryOpen] = useState(false)
  const [editing, setEditing] = useState<GalleryImage | null>(null)
  const [progress, setProgress] = useState<string | null>(null)
  const fileInput = useRef<HTMLInputElement>(null)

  const newCategory: GalleryCategory = filter === 'all' ? 'other' : filter
  const shown = filter === 'all' ? gallery : gallery.filter((g) => g.category === filter)

  const change = async (mutate: (items: GalleryImage[]) => GalleryImage[], success?: string) => {
    try {
      await mutateList('gallery', mutate)
      if (success) toast.success(success)
    } catch (e) {
      toast.error(errorMessage(e))
    }
  }

  const addImages = (sources: string[]) => {
    if (!sources.length) return Promise.resolve()
    const items = sources.map<GalleryImage>((src) => ({ id: randomId(10), src, caption: emptyLocalized(), category: newCategory }))
    return change((list) => [...items, ...list], sources.length > 1 ? `Добавлено фото: ${sources.length}` : 'Фото добавлено')
  }

  const onFiles = async (files: FileList | null) => {
    if (!files?.length) return
    const uploaded: string[] = []
    try {
      for (const [i, file] of [...files].entries()) {
        setProgress(`${i + 1} из ${files.length}`)
        uploaded.push(await uploadImage(file))
      }
    } catch (error) {
      toast.error(errorMessage(error))
    } finally {
      setProgress(null)
      if (fileInput.current) fileInput.current.value = ''
    }
    await addImages(uploaded)
  }

  const remove = async (image: GalleryImage) => {
    const ok = await confirm({
      title: 'Убрать фото из галереи?',
      text: 'Фото исчезнет из галереи сайта (если оно используется в номерах или новостях, там оно останется).',
      confirmLabel: 'Убрать',
      danger: true,
    })
    if (ok) await change((items) => removeItem(items, image.id), 'Фото убрано из галереи')
  }

  return (
    <div className="a-page">
      <PageHeader
        title="Галерея"
        description="Фото в разделе «Галерея» на главной. Новые фото добавляются в начало; категория берётся из выбранного фильтра."
        actions={
          <>
            <button type="button" className="a-btn" onClick={() => setLibraryOpen(true)}>
              <Library size={16} /> Из библиотеки
            </button>
            <button type="button" className="a-btn a-btn--primary" onClick={() => fileInput.current?.click()} disabled={progress !== null}>
              <Upload size={16} /> {progress ? `Загрузка ${progress}…` : 'Загрузить фото'}
            </button>
            <input ref={fileInput} type="file" accept="image/*" multiple hidden onChange={(e) => onFiles(e.target.files)} />
          </>
        }
      />
      {!loading && !exists && <DefaultsNotice what="показаны фото" />}

      <div className="a-tabs" role="tablist" aria-label="Категория">
        {(['all', ...GALLERY_CATEGORIES] as const).map((c) => (
          <button key={c} type="button" role="tab" className="a-tab" aria-selected={filter === c} onClick={() => setFilter(c)}>
            {c === 'all' ? 'Все' : CATEGORY_LABELS[c]}
            <span className="a-tab__count">{c === 'all' ? gallery.length : gallery.filter((g) => g.category === c).length}</span>
          </button>
        ))}
      </div>

      {loading ? (
        <Spinner />
      ) : shown.length === 0 ? (
        <EmptyState icon={<Images />} title="Здесь пока нет фото" text="Загрузите фото с устройства или выберите из библиотеки." />
      ) : (
        <ul className="a-gallery-grid">
          {shown.map((image) => {
            const index = gallery.findIndex((g) => g.id === image.id)
            return (
              <li key={image.id} className="a-gallery-card">
                <div className="a-gallery-card__image">
                  <img src={image.src} alt="" loading="lazy" />
                </div>
                <div className="a-gallery-card__body">
                  <span className="a-gallery-card__caption">
                    {tr(image.caption, 'ru') || <span className="a-cell-muted">Без подписи</span>}
                  </span>
                  <select
                    className="a-input"
                    value={image.category}
                    aria-label="Категория"
                    onChange={(e) =>
                      change((items) => items.map((g) => (g.id === image.id ? { ...g, category: e.target.value as GalleryCategory } : g)))
                    }
                  >
                    {GALLERY_CATEGORIES.map((c) => (
                      <option key={c} value={c}>
                        {CATEGORY_LABELS[c]}
                      </option>
                    ))}
                  </select>
                  <div className="a-gallery-card__tools">
                    <div>
                      <button
                        type="button"
                        className="a-icon-btn"
                        disabled={filter !== 'all' || index === 0}
                        title={filter !== 'all' ? 'Порядок меняется во вкладке «Все»' : undefined}
                        onClick={() => change((items) => moveItem(items, image.id, -1))}
                        aria-label="Раньше"
                      >
                        <ArrowLeft size={18} />
                      </button>
                      <button
                        type="button"
                        className="a-icon-btn"
                        disabled={filter !== 'all' || index === gallery.length - 1}
                        title={filter !== 'all' ? 'Порядок меняется во вкладке «Все»' : undefined}
                        onClick={() => change((items) => moveItem(items, image.id, 1))}
                        aria-label="Позже"
                      >
                        <ArrowRight size={18} />
                      </button>
                    </div>
                    <div>
                      <button type="button" className="a-icon-btn" onClick={() => setEditing(image)} aria-label="Изменить подпись">
                        <Pencil size={18} />
                      </button>
                      <button type="button" className="a-icon-btn a-icon-btn--danger" onClick={() => remove(image)} aria-label="Убрать">
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </div>
                </div>
              </li>
            )
          })}
        </ul>
      )}

      <ImageLibrary open={libraryOpen} multiple onClose={() => setLibraryOpen(false)} onSelect={(sources) => addImages(sources)} />

      <Dialog open={editing !== null} onClose={() => setEditing(null)} labelledBy="a-caption-title" className="a-modal">
        {editing && (
          <CaptionForm
            key={editing.id}
            image={editing}
            onClose={() => setEditing(null)}
            onSave={async (image) => {
              await change((items) => upsertItem(items, image), 'Подпись сохранена')
              setEditing(null)
            }}
          />
        )}
      </Dialog>
    </div>
  )
}

function CaptionForm({ image, onClose, onSave }: { image: GalleryImage; onClose: () => void; onSave: (image: GalleryImage) => Promise<void> }) {
  const [draft, setDraft] = useState(image)
  const [saving, setSaving] = useState(false)
  return (
    <div className="a-modal__body">
      <header className="a-modal__header">
        <h2 id="a-caption-title">Фото в галерее</h2>
        <button type="button" className="a-icon-btn" onClick={onClose} aria-label="Закрыть">
          <X size={20} />
        </button>
      </header>
      <img src={draft.src} alt="" className="a-modal__preview" />
      <LocalizedField label="Подпись" value={draft.caption} onChange={(caption) => setDraft((d) => ({ ...d, caption }))} maxLength={100} />
      <label className="a-field">
        <span className="a-label">Категория</span>
        <select className="a-input" value={draft.category} onChange={(e) => setDraft((d) => ({ ...d, category: e.target.value as GalleryCategory }))}>
          {GALLERY_CATEGORIES.map((c) => (
            <option key={c} value={c}>
              {CATEGORY_LABELS[c]}
            </option>
          ))}
        </select>
      </label>
      <footer className="a-modal__footer">
        <button type="button" className="a-btn" onClick={onClose}>
          Отмена
        </button>
        <button
          type="button"
          className="a-btn a-btn--primary"
          disabled={saving}
          onClick={async () => {
            setSaving(true)
            await onSave(draft)
            setSaving(false)
          }}
        >
          {saving ? 'Сохраняем…' : 'Сохранить'}
        </button>
      </footer>
    </div>
  )
}
