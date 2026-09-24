import { useState, type ReactNode } from 'react'
import { ArrowLeft, ArrowRight, ImageOff, ImagePlus, Trash2 } from 'lucide-react'
import { ImageLibrary } from './ImageLibrary'

interface ImageFieldProps {
  label: string
  value: string
  onChange: (src: string) => void
  hint?: ReactNode
  /** Allow removing the image (for optional pictures). */
  optional?: boolean
}

/** One picture with a preview and "change" / "remove" buttons. */
export function ImageField({ label, value, onChange, hint, optional }: ImageFieldProps) {
  const [open, setOpen] = useState(false)
  return (
    <div className="a-field">
      <span className="a-label">{label}</span>
      <div className="a-image-field">
        <button type="button" className="a-image-field__preview" onClick={() => setOpen(true)} aria-label={`Изменить: ${label}`}>
          {value ? <img src={value} alt="" /> : <ImageOff size={28} />}
        </button>
        <div className="a-image-field__actions">
          <button type="button" className="a-btn a-btn--sm" onClick={() => setOpen(true)}>
            <ImagePlus size={16} />
            {value ? 'Заменить' : 'Выбрать фото'}
          </button>
          {optional && value && (
            <button type="button" className="a-btn a-btn--sm a-btn--ghost" onClick={() => onChange('')}>
              <Trash2 size={16} />
              Убрать
            </button>
          )}
        </div>
      </div>
      {hint && <p className="a-hint">{hint}</p>}
      <ImageLibrary open={open} onClose={() => setOpen(false)} onSelect={([src]) => src && onChange(src)} />
    </div>
  )
}

interface ImageListFieldProps {
  label: string
  value: string[]
  onChange: (images: string[]) => void
  hint?: ReactNode
}

/** Ordered list of photos; the first one is used as the cover. */
export function ImageListField({ label, value, onChange, hint }: ImageListFieldProps) {
  const [open, setOpen] = useState(false)

  const move = (index: number, delta: -1 | 1) => {
    const next = [...value]
    const target = index + delta
    if (target < 0 || target >= next.length) return
    ;[next[index], next[target]] = [next[target], next[index]]
    onChange(next)
  }

  return (
    <div className="a-field">
      <span className="a-label">{label}</span>
      <ul className="a-image-list">
        {value.map((src, i) => (
          <li key={src + i} className="a-image-list__item">
            <img src={src} alt="" />
            {i === 0 && <span className="a-image-list__cover">Обложка</span>}
            <div className="a-image-list__tools">
              <button type="button" className="a-icon-btn a-icon-btn--light" onClick={() => move(i, -1)} disabled={i === 0} aria-label="Сдвинуть влево">
                <ArrowLeft size={16} />
              </button>
              <button
                type="button"
                className="a-icon-btn a-icon-btn--light"
                onClick={() => move(i, 1)}
                disabled={i === value.length - 1}
                aria-label="Сдвинуть вправо"
              >
                <ArrowRight size={16} />
              </button>
              <button
                type="button"
                className="a-icon-btn a-icon-btn--light a-icon-btn--danger"
                onClick={() => onChange(value.filter((_, j) => j !== i))}
                aria-label="Удалить фото"
              >
                <Trash2 size={16} />
              </button>
            </div>
          </li>
        ))}
        <li>
          <button type="button" className="a-image-list__add" onClick={() => setOpen(true)}>
            <ImagePlus size={22} />
            Добавить фото
          </button>
        </li>
      </ul>
      {hint && <p className="a-hint">{hint}</p>}
      <ImageLibrary
        open={open}
        multiple
        onClose={() => setOpen(false)}
        onSelect={(urls) => onChange([...value, ...urls.filter((u) => !value.includes(u))])}
      />
    </div>
  )
}
