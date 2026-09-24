import { useEffect, useState, type ReactNode } from 'react'
import { onAuthStateChanged, type User } from 'firebase/auth'
import { doc, getDoc } from 'firebase/firestore'
import { errorCode } from '../../lib/firebaseConfig'
import { getAdminAuth, getDb } from '../lib/firebase'
import { AuthContext, type AuthState } from './context'

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({ status: 'loading' })

  useEffect(() => {
    const checkAccess = async (user: User) => {
      let next: AuthState
      try {
        // Access is granted by a document admins/{uid}; the rules let users read only their own.
        next = { status: 'signed-in', user, isAdmin: (await getDoc(doc(getDb(), 'admins', user.uid))).exists() }
      } catch (error) {
        console.warn('Could not check admin access', error)
        const retry = () => {
          setState({ status: 'loading' })
          void checkAccess(user)
        }
        next = { status: 'check-failed', user, code: errorCode(error), retry }
      }
      // Ignore the answer if the admin signed out (or in as someone else) meanwhile.
      if (getAdminAuth().currentUser?.uid === user.uid) setState(next)
    }

    return onAuthStateChanged(getAdminAuth(), (user) => {
      if (user) void checkAccess(user)
      else setState({ status: 'signed-out' })
    })
  }, [])

  return <AuthContext.Provider value={state}>{children}</AuthContext.Provider>
}
