import { useState, type FormEvent } from 'react'
import { sendPasswordResetEmail, signInWithEmailAndPassword } from 'firebase/auth'
import { ArrowLeft } from 'lucide-react'
import { LogoMark } from '../../components/Logo'
import { errorCode } from '../../lib/firebaseConfig'
import { getAdminAuth } from '../lib/firebase'

const AUTH_ERRORS: Record<string, string> = {
  'auth/invalid-credential': 'Неверный email или пароль.',
  'auth/invalid-email': 'Проверьте адрес электронной почты.',
  'auth/user-disabled': 'Этот аккаунт отключён.',
  'auth/user-not-found': 'Пользователь с таким email не найден.',
  'auth/wrong-password': 'Неверный email или пароль.',
  'auth/too-many-requests': 'Слишком много попыток. Подождите несколько минут и попробуйте снова.',
  'auth/network-request-failed': 'Нет соединения с сервером. Проверьте интернет.',
  'auth/missing-email': 'Введите email, чтобы получить письмо для сброса пароля.',
}

const messageFor = (error: unknown) =>
  AUTH_ERRORS[errorCode(error)] ?? 'Не удалось войти. Попробуйте ещё раз.'

export function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault()
    setBusy(true)
    setError('')
    setNotice('')
    try {
      await signInWithEmailAndPassword(getAdminAuth(), email.trim(), password)
    } catch (e) {
      setError(messageFor(e))
    } finally {
      setBusy(false)
    }
  }

  const onReset = async () => {
    setError('')
    setNotice('')
    if (!email.trim()) {
      setError(AUTH_ERRORS['auth/missing-email'])
      return
    }
    try {
      await sendPasswordResetEmail(getAdminAuth(), email.trim())
      setNotice(`Если аккаунт ${email.trim()} существует, на него придёт письмо со ссылкой для смены пароля.`)
    } catch (e) {
      setError(messageFor(e))
    }
  }

  return (
    <div className="a-auth">
      <form className="a-auth__card" onSubmit={onSubmit}>
        <div className="a-auth__brand">
          <LogoMark className="a-auth__mark" />
          <div>
            <strong>Astoria</strong>
            <span>Панель управления</span>
          </div>
        </div>
        <h1 className="a-auth__title">Вход</h1>
        <label className="a-field">
          <span className="a-label">Email</span>
          <input
            className="a-input"
            type="email"
            autoComplete="username"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoFocus
          />
        </label>
        <label className="a-field">
          <span className="a-label">Пароль</span>
          <input
            className="a-input"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </label>
        {error && (
          <p className="a-alert a-alert--danger" role="alert">
            {error}
          </p>
        )}
        {notice && (
          <p className="a-alert a-alert--success" role="status">
            {notice}
          </p>
        )}
        <button type="submit" className="a-btn a-btn--primary a-btn--block" disabled={busy}>
          {busy ? 'Входим…' : 'Войти'}
        </button>
        <button type="button" className="a-link" onClick={onReset}>
          Забыли пароль?
        </button>
      </form>
      <a className="a-auth__back" href="/">
        <ArrowLeft size={16} /> На сайт
      </a>
    </div>
  )
}
