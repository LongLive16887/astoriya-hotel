/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_FIREBASE_API_KEY?: string
  readonly VITE_FIREBASE_AUTH_DOMAIN?: string
  readonly VITE_FIREBASE_PROJECT_ID?: string
  readonly VITE_FIREBASE_STORAGE_BUCKET?: string
  readonly VITE_FIREBASE_MESSAGING_SENDER_ID?: string
  readonly VITE_FIREBASE_APP_ID?: string
  /** Public address of the site, e.g. https://astoria.uz (used in link previews). */
  readonly VITE_SITE_URL?: string
  /** "true" connects to the local Firebase emulators (see README). */
  readonly VITE_FIREBASE_EMULATORS?: string
  /** Optional: upload admin images to Cloudinary instead of Firebase Storage. */
  readonly VITE_CLOUDINARY_CLOUD_NAME?: string
  readonly VITE_CLOUDINARY_UPLOAD_PRESET?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
