import { useEffect, useState } from 'react'
import { readCache, writeCache } from '../lib/cache'
import { isFirebaseConfigured, loadPublicDb } from '../lib/firebaseConfig'
import { DEFAULT_POSTS } from './defaults'
import { normalizePost } from './normalize'
import type { Post } from './types'

const CACHE_KEY = 'posts'

/** How many posts one request brings; the news page loads more on demand. */
export const POSTS_PAGE_SIZE = 24

// One request per page load, shared by every component that shows news.
let request: Promise<Post[]> | null = null

function loadPosts(): Promise<Post[]> {
  request ??= loadPublicDb()
    .then((db) => db.fetchPublishedPosts(POSTS_PAGE_SIZE))
    .then((posts) => {
      writeCache(CACHE_KEY, posts)
      return posts
    })
  return request
}

function cachedPosts(): Post[] | null {
  const cached = readCache<unknown[]>(CACHE_KEY)
  if (!Array.isArray(cached)) return null
  return cached.map((p) => normalizePost(String((p as { id?: unknown }).id ?? ''), p))
}

/** Published news, newest first. `null` while the first request is in flight. */
export function usePosts(): Post[] | null {
  const [posts, setPosts] = useState<Post[] | null>(() =>
    isFirebaseConfigured ? cachedPosts() : DEFAULT_POSTS,
  )

  useEffect(() => {
    if (!isFirebaseConfigured) return
    let active = true
    loadPosts()
      .then((fresh) => {
        if (active) setPosts(fresh)
      })
      .catch((error: unknown) => {
        console.warn('Could not load news.', error)
        request = null
        if (active) setPosts((current) => current ?? [])
      })
    return () => {
      active = false
    }
  }, [])

  return posts
}

/** Published news for the news page: the first page from usePosts, then older ones on request. */
export function usePostPages() {
  const first = usePosts()
  const [older, setOlder] = useState<Post[]>([])
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)

  // The first page may be refreshed after older pages were loaded; do not show a post twice.
  const posts = first && [...first, ...older.filter((p) => !first.some((f) => f.id === p.id))]
  const hasMore = isFirebaseConfigured && !done && posts !== null && posts.length >= POSTS_PAGE_SIZE

  const loadMore = async () => {
    const last = posts?.at(-1)
    if (!last || loading) return
    setLoading(true)
    try {
      const page = await (await loadPublicDb()).fetchPublishedPosts(POSTS_PAGE_SIZE, last)
      setOlder((current) => [...current, ...page])
      if (page.length < POSTS_PAGE_SIZE) setDone(true)
    } catch (error) {
      // The button stays, so the visitor can try again.
      console.warn('Could not load more news.', error)
    } finally {
      setLoading(false)
    }
  }

  return { posts, hasMore, loading, loadMore }
}
