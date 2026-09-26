import { DEFAULT_CONTENT, DEFAULT_POSTS } from '../src/content/defaults'
import { normalizeListDoc, normalizeSettings } from '../src/content/normalize'
import type { ContentKey } from '../src/content/types'
import { getMeta, setMeta, transaction, type Db } from './db'
import { getPost, savePost } from './posts'

export const CONTENT_KEYS: readonly ContentKey[] = ['settings', 'rooms', 'services', 'gallery', 'reviews']

export const isContentKey = (value: string): value is ContentKey => (CONTENT_KEYS as readonly string[]).includes(value)

/** The stored shape of a document: the settings object, or `{ items }` for the lists. */
export function normalizeDoc(key: ContentKey, raw: unknown): unknown {
  return key === 'settings' ? normalizeSettings(raw, DEFAULT_CONTENT.settings) : { items: normalizeListDoc(key, raw) }
}

export interface ContentDoc {
  data: unknown
  /** Grows with every save; a save based on an older version is refused. */
  version: number
}

export function getContent(db: Db, key: ContentKey): ContentDoc | null {
  const row = db.prepare('SELECT data, version FROM content WHERE key = ?').get(key) as
    | { data: string; version: number }
    | undefined
  return row ? { data: JSON.parse(row.data), version: row.version } : null
}

/** Every document for the public site, plus a tag that changes whenever one of them does. */
export function getPublicContent(db: Db): { docs: Partial<Record<ContentKey, unknown>>; etag: string } {
  const rows = db.prepare('SELECT key, data, version FROM content ORDER BY key').all() as {
    key: string
    data: string
    version: number
  }[]
  const docs: Partial<Record<ContentKey, unknown>> = {}
  for (const row of rows) if (isContentKey(row.key)) docs[row.key] = JSON.parse(row.data)
  return { docs, etag: `"${rows.map((r) => `${r.key}.${r.version}`).join('-')}"` }
}

export type SaveResult = { ok: true; version: number; data: unknown } | { ok: false; current: ContentDoc | null }

/** Saves a document if it has not changed since `baseVersion` (0 for one that does not exist yet). */
export function saveContent(db: Db, key: ContentKey, raw: unknown, baseVersion: number, editor: string, now: number): SaveResult {
  return transaction(db, () => {
    const current = getContent(db, key)
    const version = current?.version ?? 0
    if (baseVersion !== version) return { ok: false, current }
    const data = normalizeDoc(key, raw)
    db.prepare(
      `INSERT INTO content (key, data, version, updated_at, updated_by) VALUES (?, ?, ?, ?, ?)
       ON CONFLICT (key) DO UPDATE SET data = excluded.data, version = excluded.version,
         updated_at = excluded.updated_at, updated_by = excluded.updated_by`,
    ).run(key, JSON.stringify(data), version + 1, now, editor)
    return { ok: true, version: version + 1, data }
  })
}

/**
 * Fills a new database with the built-in texts, photos and sample news, so that the site and
 * the admin panel start with content. Runs once: deleting everything later does not bring it back.
 */
export function seedContent(db: Db, now: number): boolean {
  if (getMeta(db, 'seeded_at')) return false
  transaction(db, () => {
    for (const key of CONTENT_KEYS) {
      if (getContent(db, key)) continue
      const data = key === 'settings' ? DEFAULT_CONTENT.settings : { items: DEFAULT_CONTENT[key] }
      db.prepare('INSERT INTO content (key, data, version, updated_at) VALUES (?, ?, 1, ?)').run(key, JSON.stringify(data), now)
    }
    for (const post of DEFAULT_POSTS) if (!getPost(db, post.id)) savePost(db, post.id, post, '', now)
    setMeta(db, 'seeded_at', String(now))
  })
  return true
}
