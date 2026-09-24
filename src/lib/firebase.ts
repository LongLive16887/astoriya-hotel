import { getApp, getApps, initializeApp, type FirebaseApp } from 'firebase/app'
import { firebaseConfig } from './firebaseConfig'

export function getFirebaseApp(): FirebaseApp {
  return getApps().length ? getApp() : initializeApp(firebaseConfig)
}
