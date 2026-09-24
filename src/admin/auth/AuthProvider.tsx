import { useEffect, useState, type ReactNode } from 'react'
import { onAuthStateChanged } from 'firebase/auth'
import { doc, getDoc } from 'firebase/firestore'
import { getAdminAuth, getDb } from '../lib/firebase'
import { AuthContext, type AuthState } from './context'

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({ status: 'loading' })

  useEffect(
    () =>
      onAuthStateChanged(getAdminAuth(), async (user) => {
        if (!user) {
          setState({ status: 'signed-out' })
          return
        }
        let isAdmin = false
        try {
          // Access is granted by a document admins/{uid}; the rules let users read only their own.
          isAdmin = (await getDoc(doc(getDb(), 'admins', user.uid))).exists()
        } catch (error) {
          console.warn('Could not check admin access', error)
        }
        setState({ status: 'signed-in', user, isAdmin })
      }),
    [],
  )

  return <AuthContext.Provider value={state}>{children}</AuthContext.Provider>
}
