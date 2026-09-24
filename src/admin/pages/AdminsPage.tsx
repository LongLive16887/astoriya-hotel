import { useState, type FormEvent } from 'react'
import { KeyRound, Trash2, UserPlus, X } from 'lucide-react'
import { Dialog } from '../../components/Dialog'
import { randomId } from '../../lib/ids'
import { CopyButton } from '../components/CopyButton'
import { errorMessage, useConfirm, useToast } from '../components/feedback'
import { Field } from '../components/LocalizedField'
import { PageHeader, Spinner } from '../components/PageHeader'
import {
  MIN_PASSWORD_LENGTH,
  addAdmin,
  changePassword,
  removeAdmin,
  setAdminPassword,
  useAdmins,
  type AdminAccount,
} from '../lib/account'
import { formatDateTime } from '../lib/format'

const generatePassword = () => randomId(14)

export function AdminsPage() {
  const { admins, loading, error } = useAdmins()
  const toast = useToast()
  const confirm = useConfirm()
  const [adding, setAdding] = useState(false)
  const [resetFor, setResetFor] = useState<AdminAccount | null>(null)

  const remove = async (admin: AdminAccount) => {
    const ok = await confirm({
      title: `Удалить доступ ${admin.email}?`,
      text: 'Этот человек больше не сможет войти в панель управления.',
      confirmLabel: 'Удалить',
      danger: true,
    })
    if (!ok) return
    try {
      await removeAdmin(admin.id)
      toast.success('Доступ удалён')
    } catch (e) {
      toast.error(errorMessage(e))
    }
  }

  return (
    <div className="a-page a-page--narrow">
      <PageHeader
        title="Администраторы"
        description="Кто может входить в панель управления. У всех администраторов одинаковые права."
        actions={
          <button type="button" className="a-btn a-btn--primary" onClick={() => setAdding(true)}>
            <UserPlus size={16} /> Добавить
          </button>
        }
      />
      {error && <p className="a-alert a-alert--danger">{error}</p>}

      {loading ? (
        <Spinner />
      ) : (
        <ul className="a-list">
          {admins.map((admin) => (
            <li key={admin.id} className="a-row">
              <div className="a-row__main">
                <span className="a-row__title">{admin.email}</span>
                <span className="a-row__meta">
                  {admin.you ? 'Это вы · ' : ''}добавлен {formatDateTime(new Date(admin.createdAt))}
                </span>
              </div>
              {!admin.you && (
                <div className="a-row__actions">
                  <button
                    type="button"
                    className="a-icon-btn"
                    onClick={() => setResetFor(admin)}
                    aria-label={`Задать новый пароль для ${admin.email}`}
                    title="Задать новый пароль"
                  >
                    <KeyRound size={18} />
                  </button>
                  <button
                    type="button"
                    className="a-icon-btn a-icon-btn--danger"
                    onClick={() => remove(admin)}
                    aria-label={`Удалить ${admin.email}`}
                    title="Удалить"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}

      <OwnPassword />

      <Dialog open={adding} onClose={() => setAdding(false)} labelledBy="a-add-admin-title" className="a-modal">
        {adding && <AddAdminForm onClose={() => setAdding(false)} />}
      </Dialog>
      <Dialog open={resetFor !== null} onClose={() => setResetFor(null)} labelledBy="a-reset-title" className="a-modal">
        {resetFor && <ResetPasswordForm key={resetFor.id} admin={resetFor} onClose={() => setResetFor(null)} />}
      </Dialog>
    </div>
  )
}

function PasswordField({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return (
    <Field label={label} hint={`Не короче ${MIN_PASSWORD_LENGTH} символов. Передайте пароль лично или в мессенджере.`}>
      <div className="a-input-group">
        <input className="a-input" value={value} onChange={(e) => onChange(e.target.value)} autoComplete="new-password" spellCheck={false} />
        <button type="button" className="a-btn" onClick={() => onChange(generatePassword())}>
          Придумать
        </button>
      </div>
    </Field>
  )
}

function ModalHeader({ id, title, onClose }: { id: string; title: string; onClose: () => void }) {
  return (
    <header className="a-modal__header">
      <h2 id={id}>{title}</h2>
      <button type="button" className="a-icon-btn" onClick={onClose} aria-label="Закрыть">
        <X size={20} />
      </button>
    </header>
  )
}

function AddAdminForm({ onClose }: { onClose: () => void }) {
  const toast = useToast()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState(generatePassword)
  const [saving, setSaving] = useState(false)

  const submit = async (event: FormEvent) => {
    event.preventDefault()
    setSaving(true)
    try {
      await addAdmin(email.trim(), password)
      toast.success(`${email.trim()} может войти в панель`)
      onClose()
    } catch (e) {
      toast.error(errorMessage(e))
      setSaving(false)
    }
  }

  return (
    <form className="a-modal__body" onSubmit={submit}>
      <ModalHeader id="a-add-admin-title" title="Новый администратор" onClose={onClose} />
      <Field label="Email">
        <input className="a-input" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required autoFocus />
      </Field>
      <PasswordField label="Пароль для входа" value={password} onChange={setPassword} />
      <div className="a-copy-row">
        <CopyButton value={password} label="Скопировать пароль" />
      </div>
      <footer className="a-modal__footer">
        <button type="button" className="a-btn" onClick={onClose}>
          Отмена
        </button>
        <button type="submit" className="a-btn a-btn--primary" disabled={saving || password.length < MIN_PASSWORD_LENGTH}>
          {saving ? 'Добавляем…' : 'Добавить'}
        </button>
      </footer>
    </form>
  )
}

function ResetPasswordForm({ admin, onClose }: { admin: AdminAccount; onClose: () => void }) {
  const toast = useToast()
  const [password, setPassword] = useState(generatePassword)
  const [saving, setSaving] = useState(false)

  const submit = async (event: FormEvent) => {
    event.preventDefault()
    setSaving(true)
    try {
      await setAdminPassword(admin.id, password)
      toast.success(`Новый пароль задан. Передайте его ${admin.email}`)
      onClose()
    } catch (e) {
      toast.error(errorMessage(e))
      setSaving(false)
    }
  }

  return (
    <form className="a-modal__body" onSubmit={submit}>
      <ModalHeader id="a-reset-title" title={`Новый пароль для ${admin.email}`} onClose={onClose} />
      <p className="a-hint">Старый пароль перестанет работать, а вход на других устройствах сбросится.</p>
      <PasswordField label="Новый пароль" value={password} onChange={setPassword} />
      <div className="a-copy-row">
        <CopyButton value={password} label="Скопировать пароль" />
      </div>
      <footer className="a-modal__footer">
        <button type="button" className="a-btn" onClick={onClose}>
          Отмена
        </button>
        <button type="submit" className="a-btn a-btn--primary" disabled={saving || password.length < MIN_PASSWORD_LENGTH}>
          {saving ? 'Сохраняем…' : 'Задать пароль'}
        </button>
      </footer>
    </form>
  )
}

function OwnPassword() {
  const toast = useToast()
  const [current, setCurrent] = useState('')
  const [next, setNext] = useState('')
  const [repeat, setRepeat] = useState('')
  const [saving, setSaving] = useState(false)

  const submit = async (event: FormEvent) => {
    event.preventDefault()
    if (next !== repeat) {
      toast.error('Новый пароль и повтор не совпадают')
      return
    }
    setSaving(true)
    try {
      await changePassword(current, next)
      toast.success('Пароль изменён. На других устройствах нужно будет войти заново.')
      setCurrent('')
      setNext('')
      setRepeat('')
    } catch (e) {
      toast.error(errorMessage(e))
    } finally {
      setSaving(false)
    }
  }

  return (
    <form className="a-card" onSubmit={submit}>
      <h2 className="a-card__title">Сменить свой пароль</h2>
      <div className="a-grid-3">
        <Field label="Текущий пароль">
          <input className="a-input" type="password" value={current} onChange={(e) => setCurrent(e.target.value)} autoComplete="current-password" required />
        </Field>
        <Field label="Новый пароль">
          <input className="a-input" type="password" value={next} onChange={(e) => setNext(e.target.value)} autoComplete="new-password" minLength={MIN_PASSWORD_LENGTH} required />
        </Field>
        <Field label="Повторите новый">
          <input className="a-input" type="password" value={repeat} onChange={(e) => setRepeat(e.target.value)} autoComplete="new-password" required />
        </Field>
      </div>
      <div>
        <button type="submit" className="a-btn a-btn--primary" disabled={saving}>
          {saving ? 'Сохраняем…' : 'Сменить пароль'}
        </button>
      </div>
    </form>
  )
}
