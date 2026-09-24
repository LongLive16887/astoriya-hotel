import { Link } from 'react-router-dom'
import { ArrowDown, ArrowUp, BedDouble, Copy, Pencil, Plus, Trash2 } from 'lucide-react'
import { tr } from '../../content/localized'
import type { Room } from '../../content/types'
import { uniqueId } from '../../lib/ids'
import { formatUsd, formatUzs } from '../../lib/format'
import { errorMessage, useConfirm, useToast } from '../components/feedback'
import { DefaultsNotice, EmptyState, PageHeader, Spinner } from '../components/PageHeader'
import { Switch } from '../components/Switch'
import { moveItem, mutateList, removeItem, useContentDoc } from '../lib/content'
import { plural } from '../lib/format'

export function RoomsPage() {
  const { data: rooms, exists, loading, error } = useContentDoc('rooms')
  const toast = useToast()
  const confirm = useConfirm()

  const change = async (mutate: (items: Room[]) => Room[], success?: string) => {
    try {
      await mutateList('rooms', mutate)
      if (success) toast.success(success)
    } catch (e) {
      toast.error(errorMessage(e))
    }
  }

  const duplicate = (room: Room) =>
    change((items) => {
      const copy: Room = {
        ...room,
        id: uniqueId(`${room.id}-copy`, items.map((i) => i.id)),
        visible: false,
        name: { uz: `${room.name.uz} (nusxa)`, ru: `${room.name.ru} (копия)`, en: `${room.name.en} (copy)` },
      }
      const index = items.findIndex((i) => i.id === room.id)
      return [...items.slice(0, index + 1), copy, ...items.slice(index + 1)]
    }, 'Создана скрытая копия номера')

  const remove = async (room: Room) => {
    const ok = await confirm({
      title: `Удалить «${tr(room.name, 'ru')}»?`,
      text: 'Номер исчезнет с сайта. Если нужно лишь временно убрать его, выключите видимость.',
      confirmLabel: 'Удалить',
      danger: true,
    })
    if (ok) await change((items) => removeItem(items, room.id), 'Номер удалён')
  }

  return (
    <div className="a-page">
      <PageHeader
        title="Номера и цены"
        description="Порядок в списке — это порядок на сайте. Скрытые номера не видны гостям и не предлагаются в форме бронирования."
        actions={
          <Link to="/admin/rooms/new" className="a-btn a-btn--primary">
            <Plus size={16} /> Добавить номер
          </Link>
        }
      />
      {!loading && !exists && <DefaultsNotice what="показаны номера" />}
      {error && <p className="a-alert a-alert--danger">{error}</p>}

      {loading ? (
        <Spinner />
      ) : rooms.length === 0 ? (
        <EmptyState icon={<BedDouble />} title="Номеров пока нет" text="Добавьте первый номер — он сразу появится на сайте." />
      ) : (
        <ul className="a-list">
          {rooms.map((room, i) => (
            <li key={room.id} className={`a-row ${room.visible ? '' : 'is-hidden'}`}>
              <div className="a-row__thumb">{room.images[0] && <img src={room.images[0]} alt="" />}</div>
              <div className="a-row__main">
                <Link to={`/admin/rooms/${room.id}`} className="a-row__title">
                  {tr(room.name, 'ru') || 'Без названия'}
                </Link>
                <span className="a-row__meta">
                  {[
                    room.priceUzs ? formatUzs(room.priceUzs, 'ru') : null,
                    room.priceUsd ? formatUsd(room.priceUsd) : null,
                    `до ${plural(room.guests, 'гостя', 'гостей', 'гостей')}`,
                    plural(room.images.length, 'фото', 'фото', 'фото'),
                  ]
                    .filter(Boolean)
                    .join(' · ')}
                </span>
              </div>
              <div className="a-row__actions">
                <Switch
                  checked={room.visible}
                  label={room.visible ? 'На сайте' : 'Скрыт'}
                  onChange={(visible) =>
                    change((items) => items.map((r) => (r.id === room.id ? { ...r, visible } : r)), visible ? 'Номер показан на сайте' : 'Номер скрыт')
                  }
                />
                <button type="button" className="a-icon-btn" disabled={i === 0} onClick={() => change((items) => moveItem(items, room.id, -1))} aria-label="Выше">
                  <ArrowUp size={18} />
                </button>
                <button
                  type="button"
                  className="a-icon-btn"
                  disabled={i === rooms.length - 1}
                  onClick={() => change((items) => moveItem(items, room.id, 1))}
                  aria-label="Ниже"
                >
                  <ArrowDown size={18} />
                </button>
                <Link to={`/admin/rooms/${room.id}`} className="a-icon-btn" aria-label="Редактировать" title="Редактировать">
                  <Pencil size={18} />
                </Link>
                <button type="button" className="a-icon-btn" onClick={() => duplicate(room)} aria-label="Дублировать" title="Дублировать">
                  <Copy size={18} />
                </button>
                <button type="button" className="a-icon-btn a-icon-btn--danger" onClick={() => remove(room)} aria-label="Удалить" title="Удалить">
                  <Trash2 size={18} />
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
