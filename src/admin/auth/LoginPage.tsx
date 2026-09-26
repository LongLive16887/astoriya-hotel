import { useState, type FormEvent } from 'react'
import { ArrowLeft } from 'lucide-react'
import { LogoMark } from '../../components/Logo'
import { ApiError } from '../../lib/api'
import { login } from '../lib/account'
import { useAuthActions } from './context'

function messageFor(error: unknown): string {
  if (error instanceof ApiError) {
    if (error.status === 401) return 'Неверный email или пароль.'
    if (error.status === 429) return 'Слишком много попыток. Подождите несколько минут и попробуйте снова.'
    if (error.status === 0) return 'Нет соединения с сервером. Проверьте интернет.'
  }
  return 'Не удалось войти. Попробуйте ещё раз.'
}

export function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const { signedIn } = useAuthActions()

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault()
    setBusy(true)
    setError('')
    try {
      signedIn(await login(email.trim(), password))
    } catch (e) {
      setError(messageFor(e))
      setBusy(false)
    }
  }

  return (
    <main className="a-auth">
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
        <button type="submit" className="a-btn a-btn--primary a-btn--block" disabled={busy}>
          {busy ? 'Входим…' : 'Войти'}
        </button>
        <p className="a-hint">
          Забыли пароль? Другой администратор может задать новый в разделе «Администраторы».
        </p>
      </form>
      <a className="a-auth__back" href="/">
        <ArrowLeft size={16} /> На сайт
      </a>
    </main>
  )
}
