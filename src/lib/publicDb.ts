import {
  addDoc,
  collection,
  connectFirestoreEmulator,
  doc,
  documentId,
  getDoc,
  getDocs,
  getFirestore,
  limit,
  orderBy,
  query,
  serverTimestamp,
  startAfter,
  where,
  type Firestore,
} from 'firebase/firestore/lite'
import { normalizePost } from '../content/normalize'
import type { BookingRequest, ContentKey, Post } from '../content/types'
import { cleanBooking } from './booking'
import { getFirebaseApp } from './firebase'
import { EMULATOR_HOST, EMULATOR_PORTS, errorCode, useFirebaseEmulators } from './firebaseConfig'

// The public site only reads content and creates booking requests, so it uses the
// lightweight Firestore Lite SDK. The admin panel uses the full SDK (realtime updates).

let db: Firestore | undefined

function liteDb(): Firestore {
  if (!db) {
    db = getFirestore(getFirebaseApp())
    if (useFirebaseEmulators) connectFirestoreEmulator(db, EMULATOR_HOST, EMULATOR_PORTS.firestore)
  }
  return db
}

const CONTENT_KEYS: readonly string[] = ['settings', 'rooms', 'services', 'gallery', 'reviews']

/** Raw documents of the `content` collection, keyed by document id. */
export async function fetchContentDocs(): Promise<Partial<Record<ContentKey, unknown>>> {
  const snapshot = await getDocs(collection(liteDb(), 'content'))
  const docs: Partial<Record<ContentKey, unknown>> = {}
  snapshot.forEach((d) => {
    if (CONTENT_KEYS.includes(d.id)) docs[d.id as ContentKey] = d.data()
  })
  return docs
}

/**
 * Published posts, newest first, `max` at a time; pass the last post of the previous page
 * as `after` to get the next one.
 */
export async function fetchPublishedPosts(max: number, after?: Post): Promise<Post[]> {
  const posts = collection(liteDb(), 'posts')
  try {
    // Posts from the same day are ordered by id, so the next page starts exactly after `after`.
    const snapshot = await getDocs(
      query(
        posts,
        where('published', '==', true),
        orderBy('date', 'desc'),
        orderBy(documentId(), 'desc'),
        ...(after ? [startAfter(after.date, after.id)] : []),
        limit(max),
      ),
    )
    return snapshot.docs.map((d) => normalizePost(d.id, d.data()))
  } catch (error) {
    // Without the composite index from firestore.indexes.json the ordered query fails;
    // fall back to sorting on the client so the news still show up.
    if (errorCode(error) !== 'failed-precondition') throw error
    const snapshot = await getDocs(query(posts, where('published', '==', true)))
    const sorted = snapshot.docs
      .map((d) => normalizePost(d.id, d.data()))
      .sort((a, b) => b.date.localeCompare(a.date) || (a.id < b.id ? 1 : a.id > b.id ? -1 : 0))
    const start = after ? sorted.findIndex((p) => p.id === after.id) + 1 : 0
    return sorted.slice(start, start + max)
  }
}

/** Returns null for missing posts and for drafts (which the rules do not let visitors read). */
export async function fetchPost(id: string): Promise<Post | null> {
  try {
    const snapshot = await getDoc(doc(liteDb(), 'posts', id))
    if (!snapshot.exists()) return null
    const post = normalizePost(snapshot.id, snapshot.data())
    return post.published ? post : null
  } catch (error) {
    if (errorCode(error) === 'permission-denied') return null
    throw error
  }
}

export async function submitBooking(request: BookingRequest): Promise<string> {
  const ref = await addDoc(collection(liteDb(), 'bookings'), {
    ...cleanBooking(request),
    status: 'new',
    createdAt: serverTimestamp(),
  })
  return ref.id
}
