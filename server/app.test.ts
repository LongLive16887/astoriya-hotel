import { mkdirSync, mkdtempSync, readdirSync, statSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { describe, expect, it } from 'vitest'
import { DEFAULT_CONTENT, DEFAULT_POSTS } from '../src/content/defaults'
import { addDaysIso, todayIso } from '../src/lib/format'
import { createApp } from './app'
import { createAdmin, hashPassword } from './auth'
import { seedContent } from './content'
import { openDb } from './db'
import { EventHub } from './events'

// eslint-disable-next-line @typescript-eslint/no-explicit-any -- the tests read whatever JSON the API answers
type Json = any
/** Responses whose JSON the tests read without declaring every shape. */
type TestResponse = Omit<Response, 'json'> & { json(): Promise<Json> }

const NOW = Date.UTC(2026, 8, 24, 9, 0)
const TODAY = todayIso(new Date(NOW))
const HOST = 'astoria.test'

async function setup() {
  const dataDir = mkdtempSync(path.join(tmpdir(), 'astoria-'))
  mkdirSync(path.join(dataDir, 'uploads'))
  const db = openDb(':memory:')
  seedContent(db, NOW)
  let clock = NOW
  const events = new EventHub()
  const app = createApp({
    db,
    events,
    config: { port: 0, host: '127.0.0.1', dataDir, trustProxy: true, staticDir: null, version: 'test' },
    now: () => clock,
  })
  const request = async (url: string, init: RequestInit = {}): Promise<TestResponse> =>
    app.request(`http://${HOST}${url}`, { ...init, headers: { host: HOST, ...(init.headers as Record<string, string>) } })
  const send = (method: string, url: string, body?: unknown, headers: Record<string, string> = {}) =>
    request(url, { method, headers: { 'content-type': 'application/json', ...headers }, body: body === undefined ? undefined : JSON.stringify(body) })

  await createAdmin(db, 'owner@astoria.test', await hashPassword('secret123'), NOW)
  const login = async (email = 'owner@astoria.test', password = 'secret123') => {
    const res = await send('POST', '/api/auth/login', { email, password }, { 'x-forwarded-for': '10.0.0.1' })
    const cookie = res.headers.get('set-cookie')?.split(';')[0] ?? ''
    return { res, cookie }
  }
  return { app, db, events, dataDir, request, send, login, advance: (ms: number) => (clock += ms) }
}

const booking = (over: Record<string, unknown> = {}) => ({
  name: 'Иван Петров',
  phone: '+998 90 123 45 67',
  email: '',
  checkIn: addDaysIso(TODAY, 3),
  checkOut: addDaysIso(TODAY, 5),
  adults: 2,
  children: 1,
  roomId: 'family-room',
  roomName: 'anything the guest sends',
  message: 'Приедем поздно',
  lang: 'ru',
  ...over,
})

describe('public API', () => {
  it('reports health and the seeded content', async () => {
    const { request } = await setup()
    expect(await (await request('/api/health')).json()).toEqual({ ok: true, version: 'test' })
    const res = await request('/api/content')
    const docs = await res.json()
    expect(docs.settings.phone).toBe(DEFAULT_CONTENT.settings.phone)
    expect(docs.rooms.items).toHaveLength(DEFAULT_CONTENT.rooms.length)
    const again = await request('/api/content', { headers: { 'if-none-match': res.headers.get('etag')! } })
    expect(again.status).toBe(304)
  })

  it('lists published posts page by page, newest first', async () => {
    const { db, request } = await setup()
    const { savePost } = await import('./posts')
    for (let i = 0; i < 5; i++) savePost(db, `same-day-${i}`, { ...DEFAULT_POSTS[0], date: '2026-09-01' }, '', NOW)
    savePost(db, 'draft', { ...DEFAULT_POSTS[0], published: false, date: '2026-09-30' }, '', NOW)
    const first = (await (await request('/api/posts?limit=3')).json()).posts
    expect(first.map((p: { id: string }) => p.id)).toEqual(['same-day-4', 'same-day-3', 'same-day-2'])
    const last = first[2]
    const next = (await (await request(`/api/posts?limit=10&afterDate=${last.date}&afterId=${last.id}`)).json()).posts
    expect(next.map((p: { id: string }) => p.id)).toEqual(['same-day-1', 'same-day-0', ...DEFAULT_POSTS.map((p) => p.id)])
    expect((await request('/api/posts/draft')).status).toBe(404)
    expect((await request('/api/posts/same-day-1')).status).toBe(200)
  })

  it('accepts a valid booking request and takes the room name from the content', async () => {
    const { send, db, events } = await setup()
    const seen: string[] = []
    events.subscribe((event) => seen.push(event))
    const res = await send('POST', '/api/bookings', booking(), { 'x-forwarded-for': '1.1.1.1' })
    expect(res.status).toBe(201)
    const { id } = await res.json()
    const { getBooking } = await import('./bookings')
    const stored = getBooking(db, id)!
    expect(stored).toMatchObject({ status: 'new', name: 'Иван Петров', roomId: 'family-room', roomName: 'Семейный номер', message: 'Приедем поздно' })
    expect(seen).toEqual(['booking-created', 'bookings'])

    const unknownRoom = await send('POST', '/api/bookings', booking({ roomId: 'penthouse' }), { 'x-forwarded-for': '1.1.1.2' })
    expect(getBooking(db, (await unknownRoom.json()).id)).toMatchObject({ roomId: '', roomName: '' })
  })

  it('rejects invalid requests with the failing fields', async () => {
    const { send } = await setup()
    const res = await send('POST', '/api/bookings', booking({ name: 'A', checkIn: addDaysIso(TODAY, -5), adults: 11 }))
    expect(res.status).toBe(400)
    expect((await res.json()).fields).toMatchObject({ name: 'name', checkIn: 'past', adults: 'guests' })
    expect((await send('POST', '/api/bookings', booking({ adults: '2' }))).status).toBe(400)
    expect((await send('POST', '/api/bookings', booking({ checkIn: 'soon' }))).status).toBe(400)
    const form = await send('POST', '/api/bookings', 'name=x', { 'content-type': 'application/x-www-form-urlencoded' })
    expect(form.status).toBe(415)
  })

  it('refuses requests sent from another site', async () => {
    const { send } = await setup()
    const res = await send('POST', '/api/bookings', booking(), { origin: 'https://evil.example' })
    expect(res.status).toBe(403)
    expect((await send('POST', '/api/bookings', booking(), { origin: `https://${HOST}` })).status).toBe(201)
  })

  it('limits how many requests one address can send', async () => {
    const { send, advance } = await setup()
    const post = () => send('POST', '/api/bookings', booking(), { 'x-forwarded-for': '2.2.2.2' })
    for (let i = 0; i < 5; i++) expect((await post()).status).toBe(201)
    const blocked = await post()
    expect(blocked.status).toBe(429)
    expect(Number(blocked.headers.get('retry-after'))).toBeGreaterThan(0)
    expect((await send('POST', '/api/bookings', booking(), { 'x-forwarded-for': '3.3.3.3' })).status).toBe(201)
    advance(11 * 60_000)
    expect((await post()).status).toBe(201)
  })
})

describe('sign-in', () => {
  it('lets an admin in with the right password only', async () => {
    const { login, request } = await setup()
    expect((await login('owner@astoria.test', 'wrong-password')).res.status).toBe(401)
    expect((await login('nobody@astoria.test', 'secret123')).res.status).toBe(401)
    const { res, cookie } = await login('Owner@Astoria.test')
    expect(res.status).toBe(200)
    expect(res.headers.get('set-cookie')).toMatch(/HttpOnly/i)
    expect(await (await request('/api/auth/me', { headers: { cookie } })).json()).toEqual({ email: 'owner@astoria.test' })
  })

  it('keeps the admin API closed without a session and after sign-out', async () => {
    const { login, request, send } = await setup()
    expect((await request('/api/admin/bookings')).status).toBe(401)
    expect((await request('/api/admin/bookings', { headers: { cookie: 'astoria_session=forged' } })).status).toBe(401)
    const { cookie } = await login()
    expect((await request('/api/admin/bookings', { headers: { cookie } })).status).toBe(200)
    await send('POST', '/api/auth/logout', undefined, { cookie })
    expect((await request('/api/admin/bookings', { headers: { cookie } })).status).toBe(401)
  })

  it('slows down password guessing', async () => {
    const { login } = await setup()
    for (let i = 0; i < 10; i++) expect((await login('owner@astoria.test', `guess-${i}`)).res.status).toBe(401)
    expect((await login()).res.status).toBe(429)
  })
})

describe('admin API', () => {
  it('saves content only on top of the latest version and cleans it up', async () => {
    const { login, request, send, events } = await setup()
    const { cookie } = await login()
    const seen: string[] = []
    events.subscribe((event) => seen.push(event))
    const current = await (await request('/api/admin/content/services', { headers: { cookie } })).json()
    expect(current.version).toBe(1)
    const [first, ...rest] = current.data.items
    const items = [{ ...first, extra: 'dropped' }, ...rest, { title: 'no id' }, 42, first]
    const saved = await send('PUT', '/api/admin/content/services', { data: { items }, version: 1 }, { cookie })
    expect(saved.status).toBe(200)
    const body = await saved.json()
    expect(body.version).toBe(2)
    expect(body.data.items).toHaveLength(current.data.items.length)
    expect(body.data.items[0]).not.toHaveProperty('extra')
    expect(seen).toEqual(['content:services'])
    const stale = await send('PUT', '/api/admin/content/services', { data: { items: [] }, version: 1 }, { cookie })
    expect(stale.status).toBe(409)
    expect((await stale.json()).current.version).toBe(2)
    expect((await request('/api/admin/content/unknown', { headers: { cookie } })).status).toBe(404)
  })

  it('manages posts, drafts included', async () => {
    const { login, request, send } = await setup()
    const { cookie } = await login()
    const draft = { ...DEFAULT_POSTS[0], published: false, date: '2026-10-01' }
    expect((await send('PUT', '/api/admin/posts/autumn', draft, { cookie })).status).toBe(200)
    expect((await send('PUT', '/api/admin/posts/Not%20Valid', draft, { cookie })).status).toBe(400)
    const all = (await (await request('/api/admin/posts', { headers: { cookie } })).json()).posts
    expect(all[0]).toMatchObject({ id: 'autumn', published: false })
    expect((await request('/api/posts/autumn')).status).toBe(404)
    expect((await send('DELETE', '/api/admin/posts/autumn', undefined, { cookie })).status).toBe(200)
    expect((await send('DELETE', '/api/admin/posts/autumn', undefined, { cookie })).status).toBe(404)
  })

  it('filters, updates and deletes booking requests', async () => {
    const { login, request, send, advance } = await setup()
    const { cookie } = await login()
    const ids: string[] = []
    for (const [i, days] of [9, 2, 5].entries()) {
      const res = await send('POST', '/api/bookings', booking({ checkIn: addDaysIso(TODAY, days), checkOut: addDaysIso(TODAY, days + 1) }), {
        'x-forwarded-for': `4.4.4.${i}`,
      })
      ids.push((await res.json()).id)
      advance(60_000)
    }
    const get = async (query: string) =>
      (await (await request(`/api/admin/bookings${query}`, { headers: { cookie } })).json()).bookings.map((b: { id: string }) => b.id)
    expect(await get('')).toEqual([...ids].reverse())
    expect(await get(`?checkInFrom=${TODAY}&checkInTo=${addDaysIso(TODAY, 7)}`)).toEqual([ids[1], ids[2]])
    expect(await get(`?since=${NOW + 30_000}`)).toEqual([ids[2], ids[1]])

    const patched = await send('PATCH', `/api/admin/bookings/${ids[0]}`, { status: 'confirmed', note: 'Позвонили' }, { cookie })
    expect(await patched.json()).toMatchObject({ status: 'confirmed', note: 'Позвонили', updatedBy: 'owner@astoria.test' })
    expect(await get('?status=confirmed')).toEqual([ids[0]])
    expect((await send('PATCH', `/api/admin/bookings/${ids[0]}`, { status: 'lost' }, { cookie })).status).toBe(400)
    expect((await send('DELETE', `/api/admin/bookings/${ids[0]}`, undefined, { cookie })).status).toBe(200)
    expect((await request(`/api/admin/bookings/${ids[0]}`, { headers: { cookie } })).status).toBe(404)
  })

  it('stores only real images', async () => {
    const { login, request, dataDir } = await setup()
    const { cookie } = await login()
    const upload = (type: string, bytes: Uint8Array) =>
      request('/api/admin/uploads', { method: 'POST', headers: { cookie, 'content-type': type }, body: bytes })
    const webp = new Uint8Array([...Buffer.from('RIFF'), 0, 0, 0, 0, ...Buffer.from('WEBPVP8 '), 1, 2, 3])
    const ok = await upload('image/webp', webp)
    expect(ok.status).toBe(201)
    const { url } = await ok.json()
    expect(url).toMatch(/^\/uploads\/\d{4}-\d{2}-\d{2}-[0-9a-f]{12}\.webp$/)
    expect(readdirSync(path.join(dataDir, 'uploads'))).toEqual([url.slice('/uploads/'.length)])
    expect(statSync(path.join(dataDir, url)).mode & 0o777).toBe(0o644)
    expect((await upload('image/svg+xml', Buffer.from('<svg onload="alert(1)"/>'))).status).toBe(415)
    expect((await upload('image/png', webp)).status).toBe(415)
    const big = await upload('image/webp', new Uint8Array(10 * 1024 * 1024 + 1))
    expect(big.status).toBe(413)
    const list = (await (await request('/api/admin/uploads', { headers: { cookie } })).json()).uploads
    expect(list.map((u: { url: string }) => u.url)).toEqual([url])
  })

  it('manages admins and passwords', async () => {
    const { login, request, send } = await setup()
    const { cookie } = await login()
    expect((await send('POST', '/api/admin/admins', { email: 'staff@astoria.test', password: 'short' }, { cookie })).status).toBe(400)
    const added = await send('POST', '/api/admin/admins', { email: 'Staff@Astoria.test', password: 'long-enough' }, { cookie })
    expect(added.status).toBe(201)
    expect((await send('POST', '/api/admin/admins', { email: 'staff@astoria.test', password: 'long-enough' }, { cookie })).status).toBe(409)
    const staff = await login('staff@astoria.test', 'long-enough')
    expect(staff.res.status).toBe(200)

    const admins = (await (await request('/api/admin/admins', { headers: { cookie } })).json()).admins
    const me = admins.find((a: { you: boolean }) => a.you)
    expect((await send('DELETE', `/api/admin/admins/${me.id}`, undefined, { cookie })).status).toBe(400)

    const change = (currentPassword: string, newPassword: string) =>
      send('POST', '/api/admin/account/password', { currentPassword, newPassword }, { cookie: staff.cookie })
    expect((await change('wrong', 'new-password')).status).toBe(400)
    const other = await login('staff@astoria.test', 'long-enough')
    expect((await change('long-enough', 'new-password')).status).toBe(200)
    expect((await request('/api/auth/me', { headers: { cookie: other.cookie } })).status).toBe(401)
    expect((await request('/api/auth/me', { headers: { cookie: staff.cookie } })).status).toBe(200)
    expect((await login('staff@astoria.test', 'new-password')).res.status).toBe(200)

    // Another admin can set a new password for someone who forgot theirs.
    const staffId = admins.find((a: { email: string }) => a.email === 'staff@astoria.test').id
    expect((await send('POST', `/api/admin/admins/${staffId}/password`, { password: 'reset-by-owner' }, { cookie })).status).toBe(200)
    expect((await request('/api/auth/me', { headers: { cookie: staff.cookie } })).status).toBe(401)
    expect((await login('staff@astoria.test', 'reset-by-owner')).res.status).toBe(200)
  })

  it('streams changes to the admin panel', async () => {
    const { login, request, send } = await setup()
    const { cookie } = await login()
    const controller = new AbortController()
    const res = await request('/api/admin/events', { headers: { cookie }, signal: controller.signal })
    expect(res.headers.get('content-type')).toMatch(/text\/event-stream/)
    const reader = res.body!.getReader()
    const decoder = new TextDecoder()
    let text = ''
    const readUntil = async (needle: string) => {
      while (!text.includes(needle)) text += decoder.decode((await reader.read()).value)
    }
    await readUntil('event: ready')
    await send('POST', '/api/bookings', booking(), { 'x-forwarded-for': '5.5.5.5' })
    await readUntil('event: bookings')
    expect(text).toContain('event: booking-created')
    expect(text).toContain('"name":"Иван Петров"')
    controller.abort()
  })
})
