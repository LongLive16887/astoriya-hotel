import { useCallback, useMemo, useRef, useState, type ReactNode } from 'react'
import { CircleAlert, CircleCheck, Info, X } from 'lucide-react'
import { Dialog } from '../../components/Dialog'
import { ConfirmContext, ToastContext, type ConfirmOptions, type Toaster, type ToastTone } from './feedback'

interface Toast {
  id: number
  tone: ToastTone
  message: string
}

const ICONS = { success: CircleCheck, error: CircleAlert, info: Info }

/** Toasts and confirmation dialogs for the admin panel. */
export function FeedbackProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])
  const nextId = useRef(1)
  const [confirmState, setConfirmState] = useState<(ConfirmOptions & { resolve: (ok: boolean) => void }) | null>(null)

  const dismiss = useCallback((id: number) => setToasts((list) => list.filter((t) => t.id !== id)), [])

  const push = useCallback(
    (tone: ToastTone, message: string) => {
      const id = nextId.current++
      setToasts((list) => [...list.slice(-3), { id, tone, message }])
      window.setTimeout(() => dismiss(id), tone === 'error' ? 7000 : 3500)
    },
    [dismiss],
  )

  const toaster = useMemo<Toaster>(
    () => ({
      success: (m) => push('success', m),
      error: (m) => push('error', m),
      info: (m) => push('info', m),
    }),
    [push],
  )

  const confirm = useCallback(
    (options: ConfirmOptions) => new Promise<boolean>((resolve) => setConfirmState({ ...options, resolve })),
    [],
  )

  const close = (ok: boolean) => {
    confirmState?.resolve(ok)
    setConfirmState(null)
  }

  return (
    <ToastContext.Provider value={toaster}>
      <ConfirmContext.Provider value={confirm}>
        {children}
        <div className="a-toasts" role="status" aria-live="polite">
          {toasts.map((toast) => {
            const Icon = ICONS[toast.tone]
            return (
              <div key={toast.id} className={`a-toast a-toast--${toast.tone}`}>
                <Icon size={18} />
                <span>{toast.message}</span>
                <button type="button" onClick={() => dismiss(toast.id)} aria-label="Закрыть">
                  <X size={16} />
                </button>
              </div>
            )
          })}
        </div>
        <Dialog open={confirmState !== null} onClose={() => close(false)} labelledBy="a-confirm-title" className="a-confirm">
          {confirmState && (
            <div className="a-confirm__body">
              <h2 id="a-confirm-title">{confirmState.title}</h2>
              {confirmState.text && <p>{confirmState.text}</p>}
              <div className="a-confirm__actions">
                <button type="button" className="a-btn" onClick={() => close(false)}>
                  Отмена
                </button>
                <button
                  type="button"
                  className={`a-btn ${confirmState.danger ? 'a-btn--danger' : 'a-btn--primary'}`}
                  onClick={() => close(true)}
                  autoFocus
                >
                  {confirmState.confirmLabel ?? 'Подтвердить'}
                </button>
              </div>
            </div>
          )}
        </Dialog>
      </ConfirmContext.Provider>
    </ToastContext.Provider>
  )
}
