import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, ExternalLink, Save } from 'lucide-react'
import { AMENITY_ICONS } from '../../components/icons'
import { emptyLocalized, tr } from '../../content/localized'
import { AMENITIES, type Room } from '../../content/types'
import { uniqueId } from '../../lib/ids'
import { formatUsd, formatUzs } from '../../lib/format'
import ru from '../../i18n/ru'
import { errorMessage, useToast } from '../components/feedback'
import { ImageListField } from '../components/ImageFields'
import { Field, LocalizedField } from '../components/LocalizedField'
import { PageHeader, Spinner } from '../components/PageHeader'
import { SaveBar } from '../components/SaveBar'
import { Switch } from '../components/Switch'
import { useUnsavedChanges } from '../components/useUnsavedChanges'
import { mutateList, upsertItem, useContentDoc } from '../lib/content'

const emptyRoom = (): Room => ({
  id: '',
  visible: true,
  name: emptyLocalized(),
  summary: emptyLocalized(),
  description: emptyLocalized(),
  priceUzs: 0,
  priceUsd: 0,
  guests: 2,
  beds: emptyLocalized(),
  area: 0,
  amenities: ['wifi', 'breakfast', 'ac', 'tv', 'shower', 'toiletries'],
  images: [],
})

export function RoomEditorPage() {
  const { roomId = 'new' } = useParams()
  const { data: rooms, loading } = useContentDoc('rooms')
  if (loading) return <Spinner />

  const isNew = roomId === 'new'
  const existing = rooms.find((r) => r.id === roomId)
  if (!isNew && !existing) {
    return (
      <div className="a-page a-page--narrow">
        <PageHeader title="Номер не найден" back={<BackLink />} />
        <p className="a-alert a-alert--warning">Возможно, его удалили. Вернитесь к списку номеров.</p>
      </div>
    )
  }
  return <RoomEditor key={roomId} initial={existing ?? emptyRoom()} isNew={isNew} takenIds={rooms.map((r) => r.id)} />
}

function BackLink() {
  return (
    <Link to="/admin/rooms" className="a-back">
      <ArrowLeft size={16} /> Все номера
    </Link>
  )
}

function RoomEditor({ initial, isNew, takenIds }: { initial: Room; isNew: boolean; takenIds: string[] }) {
  const navigate = useNavigate()
  const toast = useToast()
  const [room, setRoom] = useState(initial)
  const [saving, setSaving] = useState(false)
  const dirty = JSON.stringify(room) !== JSON.stringify(initial)
  const { allowLeave } = useUnsavedChanges(dirty)

  const set = <K extends keyof Room>(key: K, value: Room[K]) => setRoom((r) => ({ ...r, [key]: value }))
  const toggleAmenity = (amenity: Room['amenities'][number], on: boolean) =>
    set('amenities', on ? AMENITIES.filter((a) => a === amenity || room.amenities.includes(a)) : room.amenities.filter((a) => a !== amenity))

  const save = async () => {
    const title = room.name.en || room.name.ru || room.name.uz
    if (!title.trim()) {
      toast.error('Укажите название номера хотя бы на одном языке')
      return
    }
    setSaving(true)
    try {
      const id = isNew ? uniqueId(title, takenIds) : room.id
      await mutateList('rooms', (items) => upsertItem(items, { ...room, id }))
      toast.success(isNew ? 'Номер добавлен' : 'Изменения сохранены')
      allowLeave()
      navigate('/admin/rooms')
    } catch (error) {
      toast.error(errorMessage(error))
      setSaving(false)
    }
  }

  return (
    <div className="a-page a-page--narrow">
      <PageHeader
        back={<BackLink />}
        title={isNew ? 'Новый номер' : tr(initial.name, 'ru') || 'Номер'}
        actions={
          <>
            {!isNew && room.visible && (
              <a className="a-btn" href={`/rooms/${room.id}`} target="_blank" rel="noopener noreferrer">
                <ExternalLink size={16} /> На сайте
              </a>
            )}
            <button type="button" className="a-btn a-btn--primary" onClick={save} disabled={saving || (!dirty && !isNew)}>
              <Save size={16} /> {saving ? 'Сохраняем…' : 'Сохранить'}
            </button>
          </>
        }
      />

      <div className="a-form">
        <section className="a-card">
          <h2 className="a-card__title">Описание</h2>
          <p className="a-card__subtitle">
            Тексты заполняются на трёх языках — переключайте UZ / RU / EN. Точкой отмечены пустые языки: там сайт покажет
            текст на другом языке.
          </p>
          <LocalizedField label="Название" value={room.name} onChange={(v) => set('name', v)} maxLength={80} />
          <LocalizedField
            label="Кратко (для карточки)"
            value={room.summary}
            onChange={(v) => set('summary', v)}
            maxLength={140}
            hint="Одна строка о главном: для кого номер и чем хорош."
          />
          <LocalizedField
            label="Подробное описание"
            value={room.description}
            onChange={(v) => set('description', v)}
            multiline
            rows={7}
            hint="Абзацы разделяйте пустой строкой."
          />
        </section>

        <section className="a-card">
          <h2 className="a-card__title">Цена и вместимость</h2>
          <div className="a-grid-2">
            <Field label="Цена за ночь, сум" hint={room.priceUzs ? formatUzs(room.priceUzs, 'ru') : 'Основная цена на сайте'}>
              <input
                className="a-input"
                type="number"
                min={0}
                step={10000}
                value={room.priceUzs || ''}
                onChange={(e) => set('priceUzs', Math.max(0, Number(e.target.value)))}
              />
            </Field>
            <Field label="Цена за ночь, USD" hint={room.priceUsd ? `Показывается как «≈ ${formatUsd(room.priceUsd)}»` : 'Необязательно'}>
              <input
                className="a-input"
                type="number"
                min={0}
                step={1}
                value={room.priceUsd || ''}
                onChange={(e) => set('priceUsd', Math.max(0, Number(e.target.value)))}
              />
            </Field>
            <Field label="Максимум гостей">
              <input
                className="a-input"
                type="number"
                min={1}
                max={12}
                value={room.guests}
                onChange={(e) => set('guests', Math.min(12, Math.max(1, Number(e.target.value) || 1)))}
              />
            </Field>
            <Field label="Площадь, м²" hint="0 — не показывать">
              <input
                className="a-input"
                type="number"
                min={0}
                value={room.area || ''}
                onChange={(e) => set('area', Math.max(0, Number(e.target.value)))}
              />
            </Field>
          </div>
          <LocalizedField label="Кровати" value={room.beds} onChange={(v) => set('beds', v)} placeholder="Например: 2 односпальные кровати" maxLength={80} />
        </section>

        <section className="a-card">
          <h2 className="a-card__title">Удобства в номере</h2>
          <div className="a-checks">
            {AMENITIES.map((amenity) => {
              const Icon = AMENITY_ICONS[amenity]
              return (
                <label key={amenity} className="a-check">
                  <input
                    type="checkbox"
                    checked={room.amenities.includes(amenity)}
                    onChange={(e) => toggleAmenity(amenity, e.target.checked)}
                  />
                  <Icon size={18} />
                  {ru.amenities[amenity]}
                </label>
              )
            })}
          </div>
        </section>

        <section className="a-card">
          <h2 className="a-card__title">Фотографии</h2>
          <ImageListField
            label="Фото номера"
            value={room.images}
            onChange={(images) => set('images', images)}
            hint="Первое фото — обложка карточки. Лучше горизонтальные снимки 4:3, от 1600 px по ширине."
          />
        </section>

        <section className="a-card">
          <h2 className="a-card__title">Публикация</h2>
          <Switch
            checked={room.visible}
            onChange={(visible) => set('visible', visible)}
            label={room.visible ? 'Номер показан на сайте' : 'Номер скрыт с сайта'}
          />
        </section>
      </div>

      {dirty && <SaveBar saving={saving} onSave={save} onReset={() => setRoom(initial)} />}
    </div>
  )
}
