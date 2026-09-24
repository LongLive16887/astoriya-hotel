import { connectAuthEmulator, getAuth, type Auth } from 'firebase/auth'
import { connectFirestoreEmulator, initializeFirestore, type Firestore } from 'firebase/firestore'
import { connectStorageEmulator, getStorage, type FirebaseStorage } from 'firebase/storage'
import { getFirebaseApp } from '../../lib/firebase'
import { EMULATOR_HOST, EMULATOR_PORTS, useFirebaseEmulators } from '../../lib/firebaseConfig'

// Full Firebase SDKs for the admin panel (realtime updates, auth, uploads).

let db: Firestore | undefined
let auth: Auth | undefined
let storage: FirebaseStorage | undefined

export function getDb(): Firestore {
  if (!db) {
    db = initializeFirestore(getFirebaseApp(), { ignoreUndefinedProperties: true })
    if (useFirebaseEmulators) connectFirestoreEmulator(db, EMULATOR_HOST, EMULATOR_PORTS.firestore)
  }
  return db
}

export function getAdminAuth(): Auth {
  if (!auth) {
    auth = getAuth(getFirebaseApp())
    auth.languageCode = 'ru'
    if (useFirebaseEmulators) {
      connectAuthEmulator(auth, `http://${EMULATOR_HOST}:${EMULATOR_PORTS.auth}`, { disableWarnings: true })
    }
  }
  return auth
}

export function getAdminStorage(): FirebaseStorage {
  if (!storage) {
    storage = getStorage(getFirebaseApp())
    if (useFirebaseEmulators) connectStorageEmulator(storage, EMULATOR_HOST, EMULATOR_PORTS.storage)
  }
  return storage
}

/** Email of the signed-in admin, stored next to every change. */
export function currentEditor(): string {
  return getAdminAuth().currentUser?.email ?? 'unknown'
}
