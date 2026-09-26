import { createContext, useContext } from 'react'
import type { AdminUser } from '../lib/account'

export type AuthState =
  | { status: 'loading' }
  | { status: 'signed-out' }
  | { status: 'signed-in'; user: AdminUser }
  /** The server could not be reached to check the session. */
  | { status: 'check-failed'; retry: () => void }

export const AuthContext = createContext<AuthState>({ status: 'loading' })

export interface AuthActions {
  signedIn: (user: AdminUser) => void
  signOut: () => Promise<void>
}

export const AuthActionsContext = createContext<AuthActions>({
  signedIn: () => {},
  signOut: async () => {},
})

export function useAuthState(): AuthState {
  return useContext(AuthContext)
}

export const useAuthActions = () => useContext(AuthActionsContext)

/** The signed-in admin; only use inside the admin layout. */
export function useAdminUser(): AdminUser {
  const state = useAuthState()
  if (state.status !== 'signed-in') throw new Error('useAdminUser outside of a signed-in session')
  return state.user
}
