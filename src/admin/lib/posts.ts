import { normalizePost } from '../../content/normalize'
import type { Post } from '../../content/types'
import { api } from '../../lib/api'
import { useLiveQuery } from './live'

interface PostsState {
  posts: Post[]
  loading: boolean
  error: string | null
}

const parsePosts = (json: unknown) =>
  ((json as { posts?: unknown[] }).posts ?? []).map((p) => normalizePost(String((p as { id?: unknown }).id ?? ''), p))

/** Every post, drafts included, newest first; updated live. */
export function useAdminPosts(): PostsState {
  const { data, loading, error } = useLiveQuery('/api/admin/posts', 'posts', parsePosts)
  return { posts: data ?? [], loading, error }
}

export async function savePost({ id, ...fields }: Post) {
  await api(`/api/admin/posts/${encodeURIComponent(id)}`, { method: 'PUT', json: fields })
}

export async function deletePost(id: string) {
  await api(`/api/admin/posts/${encodeURIComponent(id)}`, { method: 'DELETE' })
}
