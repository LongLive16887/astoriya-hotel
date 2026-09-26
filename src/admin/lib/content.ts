import { useCallback } from 'react'
import { DEFAULT_CONTENT } from '../../content/defaults'
import { normalizeListDoc, normalizeSettings } from '../../content/normalize'
import type { ContentKey, ListKey, SiteContent, SiteSettings } from '../../content/types'
import { api, ApiError } from '../../lib/api'
import { useLiveQuery } from './live'
import { mergeEdits } from './merge'

export interface ContentDocState<K extends ContentKey> {
  data: SiteContent[K]
  loading: boolean
  error: string | null
}

interface StoredDoc {
  data: unknown
  version: number
}

function normalize<K extends ContentKey>(key: K, raw: unknown): SiteContent[K] {
  if (raw === null || raw === undefined) return DEFAULT_CONTENT[key]
  if (key === 'settings') return normalizeSettings(raw, DEFAULT_CONTENT.settings) as SiteContent[K]
  return normalizeListDoc(key as ListKey, raw) as SiteContent[K]
}

/** One content document, kept up to date while it is shown. */
export function useContentDoc<K extends ContentKey>(key: K): ContentDocState<K> {
  const parse = useCallback((json: unknown) => normalize(key, (json as StoredDoc).data), [key])
  const { data, loading, error } = useLiveQuery(`/api/admin/content/${key}`, `content:${key}`, parse)
  return { data: data ?? DEFAULT_CONTENT[key], loading, error }
}

/**
 * Read, change and write a document. The server refuses a write based on an old version,
 * so when someone saved in between, the change is applied again to their version.
 */
async function update<K extends ContentKey>(key: K, change: (current: SiteContent[K]) => SiteContent[K]): Promise<SiteContent[K]> {
  for (let attempt = 0; attempt < 5; attempt++) {
    const stored = await api<StoredDoc>(`/api/admin/content/${key}`)
    const next = change(normalize(key, stored.data))
    try {
      await api(`/api/admin/content/${key}`, {
        method: 'PUT',
        json: { data: key === 'settings' ? next : { items: next }, version: stored.version },
      })
      return next
    } catch (error) {
      if (!(error instanceof ApiError && error.status === 409)) throw error
    }
  }
  throw new Error('Данные одновременно меняют в другом окне. Попробуйте сохранить ещё раз.')
}

/**
 * Saves the settings form: the fields changed since `base` (what the form was opened with) are
 * written over the stored version, which keeps changes made meanwhile elsewhere to other fields.
 * Resolves with the settings as stored.
 */
export const saveSettings = (base: SiteSettings, draft: SiteSettings) =>
  update('settings', (current) => mergeEdits(current, base, draft))

/** Changes a list (rooms, services, gallery, reviews) without losing edits made at the same time elsewhere. */
export async function mutateList<K extends ListKey>(key: K, mutate: (items: SiteContent[K]) => SiteContent[K]) {
  await update(key, mutate)
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
