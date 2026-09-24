import { getApp, getApps, initializeApp, type FirebaseApp } from 'firebase/app'

const env = import.meta.env

export const useFirebaseEmulators = env.VITE_FIREBASE_EMULATORS === 'true'

export const firebaseConfig = {
  apiKey: env.VITE_FIREBASE_API_KEY ?? (useFirebaseEmulators ? 'demo-key' : undefined),
  authDomain: env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: env.VITE_FIREBASE_PROJECT_ID ?? (useFirebaseEmulators ? 'demo-astoria' : undefined),
  storageBucket:
    env.VITE_FIREBASE_STORAGE_BUCKET ?? (useFirebaseEmulators ? 'demo-astoria.appspot.com' : undefined),
  messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: env.VITE_FIREBASE_APP_ID,
}

/** Without a Firebase project the site runs on built-in content and the admin panel explains the setup. */
export const isFirebaseConfigured = Boolean(firebaseConfig.apiKey && firebaseConfig.projectId)

export const EMULATOR_HOST = '127.0.0.1'
export const EMULATOR_PORTS = { firestore: 8080, auth: 9099, storage: 9199 } as const

export function getFirebaseApp(): FirebaseApp {
  return getApps().length ? getApp() : initializeApp(firebaseConfig)
}

/** Firebase errors carry a string `code` such as "permission-denied". */
export function errorCode(error: unknown): string {
  return typeof error === 'object' && error !== null && 'code' in error
    ? String((error as { code: unknown }).code)
    : ''
}
