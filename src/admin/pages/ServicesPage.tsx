import { useState } from 'react'
import { ArrowDown, ArrowUp, Pencil, Plus, Sparkles, Trash2, X } from 'lucide-react'
import { Dialog } from '../../components/Dialog'
import { SERVICE_ICON_COMPONENTS } from '../../components/icons'
import { emptyLocalized, tr } from '../../content/localized'
import { SERVICE_ICONS, type Service, type ServiceIcon } from '../../content/types'
import { uniqueId } from '../../lib/ids'
import { errorMessage, useConfirm, useToast } from '../components/feedback'
import { LocalizedField } from '../components/LocalizedField'
import { EmptyState, PageHeader, Spinner } from '../components/PageHeader'
import { Switch } from '../components/Switch'
import { moveItem, mutateList, removeItem, upsertItem, useContentDoc } from '../lib/content'

/** What each icon depicts: read out by screen readers and shown on hover. */
const ICON_LABELS: Record<ServiceIcon, string> = {
  waves: 'Волны',
  flame: 'Огонь',
  droplets: 'Капли',
  utensils: 'Столовые приборы',
  coffee: 'Кофе',
  sunset: 'Закат',
  concierge: 'Звонок на ресепшн',
  clock: 'Часы',
  currency: 'Деньги',
  wifi: 'Wi-Fi',
  trees: 'Деревья',
  car: 'Автомобиль',
  plane: 'Самолёт',
  shirt: 'Рубашка',
  baby: 'Ребёнок',
  dumbbell: 'Гантель',
  bath: 'Ванна',
  key: 'Ключ',
  map: 'Карта',
  luggage: 'Чемодан',
  shield: 'Щит',
  heart: 'Сердце',
  star: 'Звезда',
  sparkles: 'Блеск',
}

export function ServicesPage() {
  const { data: services, loading } = useContentDoc('services')
  const toast = useToast()
  const confirm = useConfirm()
  const [editing, setEditing] = useState<Service | null>(null)

  const change = async (mutate: (items: Service[]) => Service[], success?: string) => {
    try {
      await mutateList('services', mutate)
      if (success) toast.success(success)
      return true
    } catch (e) {
      toast.error(errorMessage(e))
      return false
    }
  }

  const remove = async (service: Service) => {
    const ok = await confirm({ title: `Удалить «${tr(service.title, 'ru')}»?`, confirmLabel: 'Удалить', danger: true })
    if (ok) await change((items) => removeItem(items, service.id), 'Услуга удалена')
  }

  const newService = (): Service => ({ id: '', visible: true, icon: 'sparkles', title: emptyLocalized(), text: emptyLocalized() })

  return (
    <div className="a-page a-page--narrow">
      <PageHeader
        title="Услуги и удобства"
        description="Карточки в разделе «Услуги и удобства» на главной странице."
        actions={
          <button type="button" className="a-btn a-btn--primary" onClick={() => setEditing(newService())}>
            <Plus size={16} /> Добавить услугу
          </button>
        }
      />

      {loading ? (
        <Spinner />
      ) : services.length === 0 ? (
        <EmptyState icon={<Sparkles />} title="Услуг пока нет" />
      ) : (
        <ul className="a-list">
          {services.map((service, i) => {
            const Icon = SERVICE_ICON_COMPONENTS[service.icon]
            return (
              <li key={service.id} className={`a-row ${service.visible ? '' : 'is-hidden'}`}>
                <span className="a-row__icon">
                  <Icon size={20} />
                </span>
                <div className="a-row__main">
                  <button type="button" className="a-row__title a-link-button" onClick={() => setEditing(service)}>
                    {tr(service.title, 'ru') || 'Без названия'}
                  </button>
                  <span className="a-row__meta">{tr(service.text, 'ru')}</span>
                </div>
                <div className="a-row__actions">
                  <Switch
                    checked={service.visible}
                    hideLabel
                    label="Показывать на сайте"
                    onChange={(visible) => change((items) => items.map((s) => (s.id === service.id ? { ...s, visible } : s)))}
                  />
                  <button type="button" className="a-icon-btn" disabled={i === 0} onClick={() => change((items) => moveItem(items, service.id, -1))} aria-label="Выше">
                    <ArrowUp size={18} />
                  </button>
                  <button
                    type="button"
                    className="a-icon-btn"
                    disabled={i === services.length - 1}
                    onClick={() => change((items) => moveItem(items, service.id, 1))}
                    aria-label="Ниже"
                  >
                    <ArrowDown size={18} />
                  </button>
                  <button type="button" className="a-icon-btn" onClick={() => setEditing(service)} aria-label="Редактировать">
                    <Pencil size={18} />
                  </button>
                  <button type="button" className="a-icon-btn a-icon-btn--danger" onClick={() => remove(service)} aria-label="Удалить">
                    <Trash2 size={18} />
                  </button>
                </div>
              </li>
            )
          })}
        </ul>
      )}

      <Dialog open={editing !== null} onClose={() => setEditing(null)} labelledBy="a-service-title" className="a-modal">
        {editing && (
          <ServiceForm
            key={editing.id || 'new'}
            initial={editing}
            onClose={() => setEditing(null)}
            onSave={async (service) => {
              const id = service.id || uniqueId(service.title.en || service.title.ru || service.title.uz, services.map((s) => s.id))
              if (await change((items) => upsertItem(items, { ...service, id }), service.id ? 'Услуга сохранена' : 'Услуга добавлена')) setEditing(null)
            }}
          />
        )}
      </Dialog>
    </div>
  )
}

function ServiceForm({ initial, onClose, onSave }: { initial: Service; onClose: () => void; onSave: (s: Service) => Promise<void> }) {
  const toast = useToast()
  const [service, setService] = useState(initial)
  const [saving, setSaving] = useState(false)

  const submit = async () => {
    if (!(service.title.ru || service.title.uz || service.title.en).trim()) {
      toast.error('Укажите название хотя бы на одном языке')
      return
    }
    setSaving(true)
    await onSave(service)
    setSaving(false)
  }

  return (
    <div className="a-modal__body">
      <header className="a-modal__header">
        <h2 id="a-service-title">{initial.id ? 'Редактировать услугу' : 'Новая услуга'}</h2>
        <button type="button" className="a-icon-btn" onClick={onClose} aria-label="Закрыть">
          <X size={20} />
        </button>
      </header>
      <div className="a-field">
        <span className="a-label">Иконка</span>
        <div className="a-icon-grid" role="group" aria-label="Иконка">
          {SERVICE_ICONS.map((icon) => {
            const Icon = SERVICE_ICON_COMPONENTS[icon]
            return (
              <button
                key={icon}
                type="button"
                aria-pressed={service.icon === icon}
                aria-label={ICON_LABELS[icon]}
                title={ICON_LABELS[icon]}
                onClick={() => setService((s) => ({ ...s, icon }))}
              >
                <Icon size={22} />
              </button>
            )
          })}
        </div>
      </div>
      <LocalizedField label="Название" value={service.title} onChange={(title) => setService((s) => ({ ...s, title }))} maxLength={60} />
      <LocalizedField
        label="Короткое описание"
        value={service.text}
        onChange={(text) => setService((s) => ({ ...s, text }))}
        multiline
        rows={2}
        maxLength={160}
      />
      <Switch checked={service.visible} onChange={(visible) => setService((s) => ({ ...s, visible }))} label="Показывать на сайте" />
      <footer className="a-modal__footer">
        <button type="button" className="a-btn" onClick={onClose}>
          Отмена
        </button>
        <button type="button" className="a-btn a-btn--primary" onClick={submit} disabled={saving}>
          {saving ? 'Сохраняем…' : 'Сохранить'}
        </button>
      </footer>
    </div>
  )
}
