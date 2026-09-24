import { useEffect, useState } from 'react'
import { doc, getDoc, onSnapshot, runTransaction, serverTimestamp, setDoc } from 'firebase/firestore'
import { DEFAULT_CONTENT } from '../../content/defaults'
import { normalizeListDoc, normalizeSettings } from '../../content/normalize'
import type { ContentKey, ListKey, SiteContent, SiteSettings } from '../../content/types'
import { currentEditor, getDb } from './firebase'

export interface ContentDocState<K extends ContentKey> {
  data: SiteContent[K]
  /** false while the document has never been saved (the site shows the defaults). */
  exists: boolean
  loading: boolean
  error: string | null
}

function normalize<K extends ContentKey>(key: K, raw: unknown): SiteContent[K] {
  if (key === 'settings') return normalizeSettings(raw, DEFAULT_CONTENT.settings) as SiteContent[K]
  return normalizeListDoc(key as ListKey, raw) as SiteContent[K]
}

/** Live view of one `content/*` document; falls back to the built-in content until it is saved. */
export function useContentDoc<K extends ContentKey>(key: K): ContentDocState<K> {
  const [state, setState] = useState<ContentDocState<K>>({
    data: DEFAULT_CONTENT[key],
    exists: false,
    loading: true,
    error: null,
  })

  useEffect(
    () =>
      onSnapshot(
        doc(getDb(), 'content', key),
        (snapshot) => {
          setState({
            data: snapshot.exists() ? normalize(key, snapshot.data()) : DEFAULT_CONTENT[key],
            exists: snapshot.exists(),
            loading: false,
            error: null,
          })
        },
        (error) => setState((s) => ({ ...s, loading: false, error: error.message })),
      ),
    [key],
  )

  return state
}

export async function saveSettings(settings: SiteSettings) {
  await setDoc(doc(getDb(), 'content', 'settings'), {
    ...settings,
    updatedAt: serverTimestamp(),
    updatedBy: currentEditor(),
  })
}

/**
 * Changes a list document (rooms, services, gallery, reviews) inside a transaction,
 * so edits made at the same time in another tab are not lost.
 */
export async function mutateList<K extends ListKey>(
  key: K,
  mutate: (items: SiteContent[K]) => SiteContent[K],
) {
  const db = getDb()
  const ref = doc(db, 'content', key)
  await runTransaction(db, async (tx) => {
    const snapshot = await tx.get(ref)
    const current = snapshot.exists() ? normalize(key, snapshot.data()) : DEFAULT_CONTENT[key]
    tx.set(ref, { items: mutate(current), updatedAt: serverTimestamp(), updatedBy: currentEditor() })
  })
}

type Item = { id: string }

/** Replaces the item with the same id, or appends it. */
export const upsertItem = <T extends Item>(items: T[], item: T): T[] =>
  items.some((i) => i.id === item.id) ? items.map((i) => (i.id === item.id ? item : i)) : [...items, item]

export const removeItem = <T extends Item>(items: T[], id: string): T[] => items.filter((i) => i.id !== id)

/** Moves an item one place up (-1) or down (+1). */
export function moveItem<T extends Item>(items: T[], id: string, delta: -1 | 1): T[] {
  const index = items.findIndex((i) => i.id === id)
  const target = index + delta
  if (index < 0 || target < 0 || target >= items.length) return items
  const next = [...items]
  ;[next[index], next[target]] = [next[target], next[index]]
  return next
}

/** Writes the built-in content for every document that has not been saved yet. */
export async function saveMissingDefaults(): Promise<ContentKey[]> {
  const db = getDb()
  const keys: ContentKey[] = ['settings', 'rooms', 'services', 'gallery', 'reviews']
  const created: ContentKey[] = []
  for (const key of keys) {
    const ref = doc(db, 'content', key)
    const snapshot = await getDoc(ref)
    if (snapshot.exists()) continue
    const meta = { updatedAt: serverTimestamp(), updatedBy: currentEditor() }
    await setDoc(ref, key === 'settings' ? { ...DEFAULT_CONTENT.settings, ...meta } : { items: DEFAULT_CONTENT[key], ...meta })
    created.push(key)
  }
  return created
}
