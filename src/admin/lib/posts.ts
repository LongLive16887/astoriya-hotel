import { useEffect, useState } from 'react'
import {
  collection,
  deleteDoc,
  doc,
  getDocs,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
} from 'firebase/firestore'
import { DEFAULT_POSTS } from '../../content/defaults'
import { normalizePost } from '../../content/normalize'
import type { Post } from '../../content/types'
import { getDb } from './firebase'

interface PostsState {
  posts: Post[]
  loading: boolean
  error: string | null
}

export function useAdminPosts(): PostsState {
  const [state, setState] = useState<PostsState>({ posts: [], loading: true, error: null })

  useEffect(
    () =>
      onSnapshot(
        query(collection(getDb(), 'posts'), orderBy('date', 'desc')),
        (snapshot) =>
          setState({
            posts: snapshot.docs.map((d) => normalizePost(d.id, d.data())),
            loading: false,
            error: null,
          }),
        (error) => setState((s) => ({ ...s, loading: false, error: error.message })),
      ),
    [],
  )

  return state
}

export async function savePost(post: Post) {
  const { id, ...fields } = post
  await setDoc(doc(getDb(), 'posts', id), { ...fields, updatedAt: serverTimestamp() })
}

export async function deletePost(id: string) {
  await deleteDoc(doc(getDb(), 'posts', id))
}

/** Adds the sample news when the collection is empty. Returns how many were added. */
export async function saveDefaultPostsIfEmpty(): Promise<number> {
  const existing = await getDocs(collection(getDb(), 'posts'))
  if (!existing.empty) return 0
  await Promise.all(DEFAULT_POSTS.map(savePost))
  return DEFAULT_POSTS.length
}
