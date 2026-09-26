import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { ApiError, UNAUTHORIZED_EVENT } from '../../lib/api'
import { fetchMe, logout } from '../lib/account'
import { AuthActionsContext, AuthContext, type AuthActions, type AuthState } from './context'

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({ status: 'loading' })

  useEffect(() => {
    let active = true
    const check = () =>
      fetchMe().then(
        (user) => active && setState({ status: 'signed-in', user }),
        (error: unknown) => {
          if (!active) return
          if (error instanceof ApiError && error.status === 401) setState({ status: 'signed-out' })
          else
            setState({
              status: 'check-failed',
              retry: () => {
                setState({ status: 'loading' })
                void check()
              },
            })
        },
      )
    void check()
    // Any admin request answered with 401 means the session has ended.
    const onUnauthorized = () => setState({ status: 'signed-out' })
    window.addEventListener(UNAUTHORIZED_EVENT, onUnauthorized)
    return () => {
      active = false
      window.removeEventListener(UNAUTHORIZED_EVENT, onUnauthorized)
    }
  }, [])

  const actions = useMemo<AuthActions>(
    () => ({
      signedIn: (user) => setState({ status: 'signed-in', user }),
      signOut: async () => {
        await logout().catch(() => {})
        setState({ status: 'signed-out' })
      },
    }),
    [],
  )

  return (
    <AuthActionsContext.Provider value={actions}>
      <AuthContext.Provider value={state}>{children}</AuthContext.Provider>
    </AuthActionsContext.Provider>
  )
}
