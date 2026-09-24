import { normalizePost } from '../content/normalize'
import type { BookingRequest, ContentKey, Post } from '../content/types'
import { api, ApiError } from './api'
import { cleanBooking } from './booking'

/** Raw content documents, keyed by name (settings, rooms, services, gallery, reviews). */
export const fetchContentDocs = () => api<Partial<Record<ContentKey, unknown>>>('/api/content')

const toPost = (raw: unknown) => normalizePost(String((raw as { id?: unknown } | null)?.id ?? ''), raw)

/** Published posts, newest first, `max` at a time; pass the last post of a page to get the next one. */
export async function fetchPublishedPosts(max: number, after?: Post): Promise<Post[]> {
  const params = new URLSearchParams({ limit: String(max) })
  if (after) {
    params.set('afterDate', after.date)
    params.set('afterId', after.id)
  }
  const { posts } = await api<{ posts: unknown[] }>(`/api/posts?${params}`)
  return posts.map(toPost)
}

/** Null for missing posts and for drafts. */
export async function fetchPost(id: string): Promise<Post | null> {
  try {
    return toPost(await api(`/api/posts/${encodeURIComponent(id)}`))
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) return null
    throw error
  }
}

export async function submitBooking(request: BookingRequest): Promise<string> {
  const { id } = await api<{ id: string }>('/api/bookings', { method: 'POST', json: cleanBooking(request) })
  return id
}
