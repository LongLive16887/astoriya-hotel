import { signOut, type User } from 'firebase/auth'
import { ShieldAlert } from 'lucide-react'
import { CopyButton } from '../components/CopyButton'
import { getAdminAuth } from '../lib/firebase'

/** Signed in, but the account has no admins/{uid} document yet. */
export function NoAccess({ user }: { user: User }) {
  return (
    <div className="a-auth">
      <div className="a-auth__card a-auth__card--wide">
        <ShieldAlert className="a-auth__icon" />
        <h1 className="a-auth__title">Нет доступа к панели</h1>
        <p>
          Вы вошли как <strong>{user.email}</strong>, но у этого аккаунта нет прав администратора.
        </p>
        <div className="a-steps">
          <p>Чтобы выдать доступ, владелец проекта должен:</p>
          <ol>
            <li>
              Открыть <strong>Firebase Console → Firestore Database</strong>.
            </li>
            <li>
              Создать коллекцию <code>admins</code> (если её ещё нет).
            </li>
            <li>
              Добавить документ, в поле «Document ID» указать UID ниже, и поле <code>email</code> со значением{' '}
              <code>{user.email}</code>.
            </li>
          </ol>
          <div className="a-copy-row">
            <code>{user.uid}</code>
            <CopyButton value={user.uid} label="Скопировать UID" />
          </div>
          <p className="a-hint">После этого обновите страницу.</p>
        </div>
        <div className="a-auth__actions">
          <button type="button" className="a-btn a-btn--primary" onClick={() => window.location.reload()}>
            Обновить
          </button>
          <button type="button" className="a-btn" onClick={() => signOut(getAdminAuth())}>
            Выйти
          </button>
        </div>
      </div>
    </div>
  )
}
