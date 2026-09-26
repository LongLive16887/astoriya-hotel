import { useMemo, useRef, useState } from 'react'
import { Check, ImagePlus, Link2, Upload, X } from 'lucide-react'
import { Dialog } from '../../components/Dialog'
import { BUILTIN_IMAGES } from '../../content/builtinImages'
import { useContentDoc } from '../lib/content'
import { useLiveQuery } from '../lib/live'
import { uploadImage } from '../lib/upload'
import { errorMessage, useToast } from './feedback'

interface ImageLibraryProps {
  open: boolean
  onClose: () => void
  onSelect: (urls: string[]) => void
  multiple?: boolean
}

/** Pick photos already on the site, upload new ones or paste a link. */
export function ImageLibrary({ open, onClose, onSelect, multiple = false }: ImageLibraryProps) {
  return (
    <Dialog open={open} onClose={onClose} labelledBy="a-library-title" className="a-library">
      {open && <LibraryBody onClose={onClose} onSelect={onSelect} multiple={multiple} />}
    </Dialog>
  )
}

const parseUploads = (json: unknown) => (json as { uploads: { url: string }[] }).uploads.map((u) => u.url)

function LibraryBody({ onClose, onSelect, multiple }: Omit<ImageLibraryProps, 'open'>) {
  const toast = useToast()
  const gallery = useContentDoc('gallery')
  const rooms = useContentDoc('rooms')
  const settings = useContentDoc('settings')
  const uploads = useLiveQuery('/api/admin/uploads', '', parseUploads)
  const [selected, setSelected] = useState<string[]>([])
  const [url, setUrl] = useState('')
  const [progress, setProgress] = useState<number | null>(null)
  const fileInput = useRef<HTMLInputElement>(null)

  // Uploaded photos (newest first) and everything used on the site, without duplicates.
  const images = useMemo(() => {
    const s = settings.data
    const all = [
      ...(uploads.data ?? []),
      ...gallery.data.map((g) => g.src),
      ...rooms.data.flatMap((r) => r.images),
      s.hero.image,
      s.hero.secondaryImage,
      s.about.image,
      s.about.secondaryImage,
      s.spa.image,
      ...BUILTIN_IMAGES,
    ]
    return [...new Set(all.filter(Boolean))]
  }, [uploads.data, gallery.data, rooms.data, settings.data])

  const toggle = (src: string) => {
    if (!multiple) {
      onSelect([src])
      onClose()
      return
    }
    setSelected((list) => (list.includes(src) ? list.filter((s) => s !== src) : [...list, src]))
  }

  const onFiles = async (files: FileList | null) => {
    if (!files?.length) return
    const uploaded: string[] = []
    try {
      for (const [i, file] of [...files].entries()) {
        const src = await uploadImage(file, (f) => setProgress((i + f) / files.length))
        uploaded.push(src)
      }
      onSelect(multiple ? uploaded : uploaded.slice(0, 1))
      toast.success(uploaded.length > 1 ? `Загружено фото: ${uploaded.length}` : 'Фото загружено')
      onClose()
    } catch (error) {
      toast.error(errorMessage(error))
      if (uploaded.length) onSelect(uploaded)
    } finally {
      setProgress(null)
      if (fileInput.current) fileInput.current.value = ''
    }
  }

  const addUrl = () => {
    const value = url.trim()
    if (!/^https:\/\/\S+$/i.test(value)) {
      toast.error('Укажите ссылку, начинающуюся с https://')
      return
    }
    onSelect([value])
    onClose()
  }

  return (
    <div className="a-library__body">
      <header className="a-library__header">
        <h2 id="a-library-title">Выбор фото</h2>
        <button type="button" className="a-icon-btn" onClick={onClose} aria-label="Закрыть">
          <X size={20} />
        </button>
      </header>

      <div className="a-library__sources">
        <button type="button" className="a-btn a-btn--primary" onClick={() => fileInput.current?.click()} disabled={progress !== null}>
          <Upload size={16} />
          {progress !== null ? `Загрузка… ${Math.round(progress * 100)}%` : multiple ? 'Загрузить с устройства' : 'Загрузить фото'}
        </button>
        <input
          ref={fileInput}
          type="file"
          accept="image/*"
          multiple={multiple}
          hidden
          onChange={(e) => onFiles(e.target.files)}
        />
        <div className="a-library__url">
          <Link2 size={16} />
          <input
            className="a-input"
            type="url"
            placeholder="или вставьте ссылку https://…"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault()
                addUrl()
              }
            }}
          />
          <button type="button" className="a-btn" onClick={addUrl} disabled={!url.trim()}>
            Добавить
          </button>
        </div>
      </div>

      <p className="a-hint">Загруженные фото и фото с сайта — нажмите, чтобы {multiple ? 'отметить' : 'выбрать'}:</p>
      <ul className="a-library__grid">
        {images.map((src) => {
          const isSelected = selected.includes(src)
          return (
            <li key={src}>
              <button
                type="button"
                className={`a-library__item ${isSelected ? 'is-selected' : ''}`}
                onClick={() => toggle(src)}
                aria-pressed={multiple ? isSelected : undefined}
              >
                <img src={src} alt="" loading="lazy" />
                {isSelected && (
                  <span className="a-library__check">
                    <Check size={16} />
                  </span>
                )}
              </button>
            </li>
          )
        })}
      </ul>

      {multiple && (
        <footer className="a-library__footer">
          <button type="button" className="a-btn" onClick={onClose}>
            Отмена
          </button>
          <button
            type="button"
            className="a-btn a-btn--primary"
            disabled={selected.length === 0}
            onClick={() => {
              onSelect(selected)
              onClose()
            }}
          >
            <ImagePlus size={16} />
            Добавить{selected.length ? ` (${selected.length})` : ''}
          </button>
        </footer>
      )}
    </div>
  )
}
