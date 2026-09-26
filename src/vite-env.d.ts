/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Public address of the site, e.g. https://astoria.uz (used in link previews). */
  readonly VITE_SITE_URL?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
