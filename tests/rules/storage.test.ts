import { readFileSync } from 'node:fs'
import {
  assertFails,
  assertSucceeds,
  initializeTestEnvironment,
  type RulesTestEnvironment,
} from '@firebase/rules-unit-testing'
import { doc, setDoc } from 'firebase/firestore'
import { deleteObject, getBytes, ref, uploadBytes } from 'firebase/storage'
import { afterAll, beforeAll, describe, it } from 'vitest'

let env: RulesTestEnvironment

const ADMIN_UID = 'admin-uid'
const IMAGE = new Uint8Array([137, 80, 78, 71, 13, 10, 26, 10])

beforeAll(async () => {
  env = await initializeTestEnvironment({
    projectId: 'demo-astoria',
    firestore: { rules: readFileSync('firestore.rules', 'utf8'), host: '127.0.0.1', port: 8080 },
    storage: { rules: readFileSync('storage.rules', 'utf8'), host: '127.0.0.1', port: 9199 },
  })
  await env.clearFirestore()
  await env.withSecurityRulesDisabled(async (ctx) => {
    await setDoc(doc(ctx.firestore(), 'admins', ADMIN_UID), { email: 'admin@example.com' })
  })
})

afterAll(async () => {
  await env.cleanup()
})

const adminStorage = () => env.authenticatedContext(ADMIN_UID).storage()
const userStorage = () => env.authenticatedContext('some-user').storage()
const guestStorage = () => env.unauthenticatedContext().storage()

describe('uploads', () => {
  it('lets admins upload and delete images', async () => {
    const file = ref(adminStorage(), 'uploads/photo.webp')
    await assertSucceeds(uploadBytes(file, IMAGE, { contentType: 'image/webp' }))
    await assertSucceeds(getBytes(ref(guestStorage(), 'uploads/photo.webp')))
    await assertSucceeds(deleteObject(file))
  })

  it('rejects files that are not images', async () => {
    const file = ref(adminStorage(), 'uploads/script.js')
    await assertFails(uploadBytes(file, IMAGE, { contentType: 'application/javascript' }))
  })

  it('rejects uploads from visitors and ordinary users', async () => {
    await assertFails(uploadBytes(ref(userStorage(), 'uploads/a.webp'), IMAGE, { contentType: 'image/webp' }))
    await assertFails(uploadBytes(ref(guestStorage(), 'uploads/b.webp'), IMAGE, { contentType: 'image/webp' }))
  })

  it('does not allow writing outside the uploads folder', async () => {
    await assertFails(uploadBytes(ref(adminStorage(), 'other/a.webp'), IMAGE, { contentType: 'image/webp' }))
  })
})
