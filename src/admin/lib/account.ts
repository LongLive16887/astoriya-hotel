import { api } from '../../lib/api'
import { useLiveQuery } from './live'

export interface AdminUser {
  email: string
}

export const fetchMe = () => api<AdminUser>('/api/auth/me')

export const login = (email: string, password: string) =>
  api<AdminUser>('/api/auth/login', { method: 'POST', json: { email, password } })

export const logout = () => api('/api/auth/logout', { method: 'POST' })

export const changePassword = (currentPassword: string, newPassword: string) =>
  api('/api/admin/account/password', { method: 'POST', json: { currentPassword, newPassword } })

export const MIN_PASSWORD_LENGTH = 8

export interface AdminAccount {
  id: number
  email: string
  createdAt: number
  /** The account of the admin looking at the list. */
  you: boolean
}

const parseAdmins = (json: unknown) => (json as { admins: AdminAccount[] }).admins

export function useAdmins() {
  const { data, loading, error } = useLiveQuery('/api/admin/admins', 'admins', parseAdmins)
  return { admins: data ?? [], loading, error }
}

export const addAdmin = (email: string, password: string) =>
  api<AdminAccount>('/api/admin/admins', { method: 'POST', json: { email, password } })

export const removeAdmin = (id: number) => api(`/api/admin/admins/${id}`, { method: 'DELETE' })

export const setAdminPassword = (id: number, password: string) =>
  api(`/api/admin/admins/${id}/password`, { method: 'POST', json: { password } })
