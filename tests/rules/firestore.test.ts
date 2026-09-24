import { readFileSync } from 'node:fs'
import {
  assertFails,
  assertSucceeds,
  initializeTestEnvironment,
  type RulesTestEnvironment,
} from '@firebase/rules-unit-testing'
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  query,
  serverTimestamp,
  setDoc,
  Timestamp,
  updateDoc,
  where,
} from 'firebase/firestore'
import { afterAll, beforeAll, beforeEach, describe, it } from 'vitest'

let env: RulesTestEnvironment

const ADMIN_UID = 'admin-uid'

beforeAll(async () => {
  env = await initializeTestEnvironment({
    projectId: 'demo-astoria',
    firestore: {
      rules: readFileSync('firestore.rules', 'utf8'),
      host: '127.0.0.1',
      port: 8080,
    },
  })
})

beforeEach(async () => {
  await env.clearFirestore()
  await env.withSecurityRulesDisabled(async (ctx) => {
    const db = ctx.firestore()
    await setDoc(doc(db, 'admins', ADMIN_UID), { email: 'admin@example.com' })
    await setDoc(doc(db, 'content', 'rooms'), { items: [] })
    await setDoc(doc(db, 'posts', 'published'), { published: true, date: '2025-07-21' })
    await setDoc(doc(db, 'posts', 'draft'), { published: false, date: '2025-07-22' })
    await setDoc(doc(db, 'bookings', 'existing'), { name: 'Guest', status: 'new' })
  })
})

afterAll(async () => {
  await env.cleanup()
})

const guestDb = () => env.unauthenticatedContext().firestore()
const userDb = () => env.authenticatedContext('some-user').firestore()
const adminDb = () => env.authenticatedContext(ADMIN_UID).firestore()

function isoInDays(days: number): string {
  const date = new Date()
  date.setUTCDate(date.getUTCDate() + days)
  return date.toISOString().slice(0, 10)
}

function booking(overrides: Record<string, unknown> = {}) {
  return {
    name: 'Anna Petrova',
    phone: '+998 90 123 45 67',
    email: 'anna@example.com',
    checkIn: isoInDays(1),
    checkOut: isoInDays(3),
    adults: 2,
    children: 1,
    roomId: 'double-deluxe',
    roomName: 'Double Deluxe',
    message: 'Late arrival',
    lang: 'ru',
    status: 'new',
    createdAt: serverTimestamp(),
    ...overrides,
  }
}

describe('bookings', () => {
  it('lets a visitor send a valid request', async () => {
    await assertSucceeds(addDoc(collection(guestDb(), 'bookings'), booking()))
  })

  it('accepts a request without optional fields', async () => {
    const minimal = booking()
    delete (minimal as Record<string, unknown>).email
    delete (minimal as Record<string, unknown>).message
    delete (minimal as Record<string, unknown>).roomId
    delete (minimal as Record<string, unknown>).roomName
    delete (minimal as Record<string, unknown>).lang
    await assertSucceeds(addDoc(collection(guestDb(), 'bookings'), minimal))
  })

  it.each([
    ['an extra field', { isPaid: true }],
    ['a status other than new', { status: 'confirmed' }],
    ['a client-side timestamp', { createdAt: Timestamp.now() }],
    ['a too short name', { name: 'A' }],
    ['a too long name', { name: 'x'.repeat(101) }],
    ['a too short phone', { phone: '123' }],
    ['a too long message', { message: 'x'.repeat(1001) }],
    ['a malformed date', { checkIn: '21.07.2025' }],
    ['a check-in in the past', { checkIn: isoInDays(-10), checkOut: isoInDays(-8) }],
    ['check-out before check-in', { checkIn: isoInDays(5), checkOut: isoInDays(4) }],
    ['check-out equal to check-in', { checkIn: isoInDays(5), checkOut: isoInDays(5) }],
    ['more than 60 nights', { checkIn: isoInDays(1), checkOut: isoInDays(62) }],
    ['zero adults', { adults: 0 }],
    ['fractional adults', { adults: 1.5 }],
    ['too many children', { children: 11 }],
    ['an unknown language', { lang: 'de' }],
  ])('rejects a request with %s', async (_label, overrides) => {
    await assertFails(addDoc(collection(guestDb(), 'bookings'), booking(overrides)))
  })

  it('rejects a request without a phone', async () => {
    const withoutPhone = booking()
    delete (withoutPhone as Record<string, unknown>).phone
    await assertFails(addDoc(collection(guestDb(), 'bookings'), withoutPhone))
  })

  it('hides requests from visitors and ordinary users', async () => {
    await assertFails(getDoc(doc(guestDb(), 'bookings', 'existing')))
    await assertFails(getDocs(collection(userDb(), 'bookings')))
    await assertFails(updateDoc(doc(userDb(), 'bookings', 'existing'), { status: 'confirmed' }))
    await assertFails(deleteDoc(doc(guestDb(), 'bookings', 'existing')))
  })

  it('lets admins read, update and delete requests', async () => {
    await assertSucceeds(getDocs(collection(adminDb(), 'bookings')))
    await assertSucceeds(updateDoc(doc(adminDb(), 'bookings', 'existing'), { status: 'confirmed', note: 'Called back' }))
    await assertSucceeds(deleteDoc(doc(adminDb(), 'bookings', 'existing')))
  })
})

describe('content', () => {
  it('is readable by everyone', async () => {
    await assertSucceeds(getDocs(collection(guestDb(), 'content')))
  })

  it('can only be changed by admins', async () => {
    await assertFails(setDoc(doc(guestDb(), 'content', 'rooms'), { items: [] }))
    await assertFails(setDoc(doc(userDb(), 'content', 'settings'), { hotelName: 'Hacked' }))
    await assertSucceeds(setDoc(doc(adminDb(), 'content', 'settings'), { hotelName: 'Astoria' }))
  })

  it('does not accept unknown documents', async () => {
    await assertFails(setDoc(doc(adminDb(), 'content', 'something-else'), { a: 1 }))
  })
})

describe('posts', () => {
  it('shows published posts to visitors', async () => {
    await assertSucceeds(getDoc(doc(guestDb(), 'posts', 'published')))
    await assertSucceeds(getDocs(query(collection(guestDb(), 'posts'), where('published', '==', true))))
  })

  it('hides drafts from visitors', async () => {
    await assertFails(getDoc(doc(guestDb(), 'posts', 'draft')))
    await assertFails(getDocs(collection(guestDb(), 'posts')))
  })

  it('lets admins read drafts and edit posts', async () => {
    await assertSucceeds(getDocs(collection(adminDb(), 'posts')))
    await assertSucceeds(setDoc(doc(adminDb(), 'posts', 'new'), { published: false, date: '2025-08-01' }))
    await assertSucceeds(deleteDoc(doc(adminDb(), 'posts', 'draft')))
    await assertFails(setDoc(doc(userDb(), 'posts', 'new'), { published: true }))
  })
})

describe('admins', () => {
  it('lets a user check only their own admin document', async () => {
    await assertSucceeds(getDoc(doc(adminDb(), 'admins', ADMIN_UID)))
    await assertSucceeds(getDoc(doc(userDb(), 'admins', 'some-user')))
    await assertFails(getDoc(doc(userDb(), 'admins', ADMIN_UID)))
    await assertFails(getDoc(doc(guestDb(), 'admins', ADMIN_UID)))
  })

  it('cannot be listed or written from the client', async () => {
    await assertFails(getDocs(collection(adminDb(), 'admins')))
    await assertFails(setDoc(doc(userDb(), 'admins', 'some-user'), { email: 'me@example.com' }))
    await assertFails(setDoc(doc(adminDb(), 'admins', 'another'), { email: 'friend@example.com' }))
  })
})
