import { createContext, useContext } from 'react'

export type ToastTone = 'success' | 'error' | 'info'

export interface Toaster {
  success: (message: string) => void
  error: (message: string) => void
  info: (message: string) => void
}

export const ToastContext = createContext<Toaster>({
  success: () => {},
  error: () => {},
  info: () => {},
})

export const useToast = () => useContext(ToastContext)

export interface ConfirmOptions {
  title: string
  text?: string
  confirmLabel?: string
  danger?: boolean
}

export const ConfirmContext = createContext<(options: ConfirmOptions) => Promise<boolean>>(async () => false)

/** Asks the user to confirm; resolves with their answer. */
export const useConfirm = () => useContext(ConfirmContext)

/** Human-readable text for an error thrown by Firebase or our own code. */
export function errorMessage(error: unknown): string {
  const code = typeof error === 'object' && error && 'code' in error ? String(error.code) : ''
  if (code === 'permission-denied') return 'Нет прав на это действие. Проверьте доступ администратора.'
  if (code === 'unavailable') return 'Нет соединения с базой данных. Проверьте интернет.'
  if (error instanceof Error && error.message) return error.message
  return 'Что-то пошло не так. Попробуйте ещё раз.'
}
