import { WifiOff } from 'lucide-react'

/** The server could not be reached to check the session: offer to try again. */
export function AccessCheckFailed({ retry }: { retry: () => void }) {
  return (
    <main className="a-auth">
      <div className="a-auth__card a-auth__card--wide">
        <WifiOff className="a-auth__icon" />
        <h1 className="a-auth__title">Нет связи с сервером</h1>
        <p>Не удалось проверить вход. Проверьте подключение к интернету и попробуйте ещё раз.</p>
        <div className="a-auth__actions">
          <button type="button" className="a-btn a-btn--primary" onClick={retry}>
            Повторить
          </button>
        </div>
      </div>
    </main>
  )
}
