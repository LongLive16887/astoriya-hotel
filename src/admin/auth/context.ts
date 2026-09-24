import { createContext, useContext } from 'react'
import type { User } from 'firebase/auth'

export type AuthState =
  | { status: 'loading' }
  | { status: 'signed-out' }
  | { status: 'signed-in'; user: User; isAdmin: boolean }

export const AuthContext = createContext<AuthState>({ status: 'loading' })

export function useAuthState(): AuthState {
  return useContext(AuthContext)
}

/** The signed-in admin; only use inside the admin layout. */
export function useAdminUser(): User {
  const state = useAuthState()
  if (state.status !== 'signed-in') throw new Error('useAdminUser outside of a signed-in session')
  return state.user
}
