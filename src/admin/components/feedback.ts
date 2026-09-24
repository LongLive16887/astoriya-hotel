import { createContext, useContext } from 'react'
import { ApiError } from '../../lib/api'

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

const API_ERRORS: Record<string, string> = {
  network: 'Нет соединения с сервером. Проверьте интернет.',
  unauthorized: 'Сессия закончилась. Войдите снова.',
  forbidden: 'Нет прав на это действие.',
  conflict: 'Данные изменились в другом окне. Обновите страницу и повторите.',
  too_large: 'Слишком большой объём данных.',
  rate_limited: 'Слишком много попыток. Подождите немного.',
  invalid_email: 'Проверьте адрес электронной почты.',
  weak_password: 'Пароль должен быть не короче 8 символов.',
  wrong_password: 'Текущий пароль указан неверно.',
  exists: 'Администратор с таким email уже есть.',
  self: 'Свой аккаунт удалить нельзя.',
  invalid_id: 'Недопустимый адрес страницы.',
  not_found: 'Запись не найдена: возможно, её уже удалили.',
}

/** Human-readable text for an error from the API or our own code. */
export function errorMessage(error: unknown): string {
  if (error instanceof ApiError) {
    if (API_ERRORS[error.code]) return API_ERRORS[error.code]
    if (error.status >= 500) return 'Ошибка на сервере. Попробуйте ещё раз через минуту.'
    return 'Что-то пошло не так. Попробуйте ещё раз.'
  }
  if (error instanceof Error && error.message) return error.message
  return 'Что-то пошло не так. Попробуйте ещё раз.'
}
