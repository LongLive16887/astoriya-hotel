import { useEffect, useState } from 'react'
import { readCache, writeCache } from '../lib/cache'
import { isFirebaseConfigured } from '../lib/firebase'
import { fetchPublishedPosts } from '../lib/publicDb'
import { DEFAULT_POSTS } from './defaults'
import { normalizePost } from './normalize'
import type { Post } from './types'

const CACHE_KEY = 'posts'

// One request per page load, shared by every component that shows news.
let request: Promise<Post[]> | null = null

function loadPosts(): Promise<Post[]> {
  request ??= fetchPublishedPosts().then((posts) => {
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
