import path from 'node:path'
import { Hono, type Context } from 'hono'
import { bodyLimit } from 'hono/body-limit'
import { deleteCookie, getCookie, setCookie } from 'hono/cookie'
import { HTTPException } from 'hono/http-exception'
import { streamSSE } from 'hono/streaming'
import { getConnInfo } from '@hono/node-server/conninfo'
import { serveStatic } from '@hono/node-server/serve-static'
import { normalizeListDoc } from '../src/content/normalize'
import { validateBooking, cleanBooking, BOOKING_LIMITS } from '../src/lib/booking'
import { addDaysIso, todayIso } from '../src/lib/format'
import {
  EMAIL,
  MIN_PASSWORD_LENGTH,
  SESSION_COOKIE,
  SESSION_TTL,
  createAdmin,
  createSession,
  deleteAdmin,
  deleteOtherSessions,
  deleteSession,
  dummyHash,
  findAdminByEmail,
  findSession,
  hashPassword,
  listAdmins,
  normalizeEmail,
  setPasswordHash,
  verifyPassword,
} from './auth'
import { createBooking, deleteBooking, getBooking, isBookingStatus, listBookings, parseBookingRequest, updateBooking, type BookingFilter } from './bookings'
import type { Config } from './config'
import { getContent, getPublicContent, isContentKey, saveContent } from './content'
import type { Db } from './db'
import { EventHub } from './events'
import { deletePost, getPost, isPostId, listAllPosts, listPublishedPosts, savePost } from './posts'
import { RateLimiter } from './rateLimit'
import { MAX_UPLOAD_SIZE, UploadRejected, listUploads, saveUpload } from './uploads'

export interface AppOptions {
  db: Db
  config: Config
  events?: EventHub
  /** Clock, replaceable in tests. */
  now?: () => number
}

type Env = { Variables: { admin: { id: number; email: string }; token: string } }

const KB = 1024

const isObject = (value: unknown): value is Record<string, unknown> => typeof value === 'object' && value !== null && !Array.isArray(value)

/** Reads a JSON body; only JSON is accepted, which also keeps plain cross-site forms out. */
async function readJson(c: Context): Promise<unknown> {
  if (!c.req.header('content-type')?.toLowerCase().startsWith('application/json')) {
    throw new HTTPException(415, { res: Response.json({ error: 'unsupported_media_type' }, { status: 415 }) })
  }
  try {
    return await c.req.json()
  } catch {
    throw new HTTPException(400, { res: Response.json({ error: 'invalid_json' }, { status: 400 }) })
  }
}

const tooLarge = (c: Context) => c.json({ error: 'too_large' }, 413)

function int(value: string | undefined, min: number, max: number, fallback: number): number {
  const n = Number(value)
  return Number.isInteger(n) ? Math.min(max, Math.max(min, n)) : fallback
}

export function createApp({ db, config, events = new EventHub(), now = Date.now }: AppOptions) {
  const app = new Hono<Env>()
  const uploadsDir = path.join(config.dataDir, 'uploads')
  const limits = {
    login: new RateLimiter(10, 15 * 60_000),
    loginEmail: new RateLimiter(10, 15 * 60_000),
    booking: new RateLimiter(5, 10 * 60_000),
    bookingDaily: new RateLimiter(20, 24 * 60 * 60_000),
    bookingTotal: new RateLimiter(300, 60 * 60_000),
  }

  const clientIp = (c: Context): string => {
    if (config.trustProxy) {
      const forwarded = c.req.header('x-forwarded-for')?.split(',')[0]?.trim()
      if (forwarded) return forwarded
    }
    try {
      return getConnInfo(c).remote.address ?? 'unknown'
    } catch {
      return 'unknown'
    }
  }

  const isHttps = (c: Context) =>
    config.trustProxy ? c.req.header('x-forwarded-proto') === 'https' : new URL(c.req.url).protocol === 'https:'

  const setSessionCookie = (c: Context, token: string) =>
    setCookie(c, SESSION_COOKIE, token, {
      httpOnly: true,
      secure: isHttps(c),
      sameSite: 'Lax',
      path: '/',
      maxAge: SESSION_TTL / 1000,
    })

  const rateLimited = (c: Context, retryAfter: number) => {
    c.header('Retry-After', String(Math.max(1, retryAfter)))
    return c.json({ error: 'rate_limited' }, 429)
  }

  app.onError((error, c) => {
    if (error instanceof HTTPException) return error.getResponse()
    console.error(error)
    return c.json({ error: 'internal' }, 500)
  })

  app.use('/api/*', async (c, next) => {
    // Browsers send Origin with cross-site requests: never let another site change data.
    if (!['GET', 'HEAD', 'OPTIONS'].includes(c.req.method)) {
      const origin = c.req.header('origin')
      let sameSite = true
      if (origin) {
        try {
          sameSite = new URL(origin).host === c.req.header('host')
        } catch {
          sameSite = false
        }
      }
      if (!sameSite) return c.json({ error: 'forbidden' }, 403)
    }
    await next()
    if (!c.res.headers.has('Cache-Control')) c.res.headers.set('Cache-Control', 'no-store')
    c.res.headers.set('X-Content-Type-Options', 'nosniff')
  })

  // --- Public API ---------------------------------------------------------------------------

  app.get('/api/health', (c) => c.json({ ok: true, version: config.version }))

  app.get('/api/content', (c) => {
    const { docs, etag } = getPublicContent(db)
    c.header('ETag', etag)
    c.header('Cache-Control', 'no-cache')
    if (c.req.header('if-none-match') === etag) return c.body(null, 304)
    return c.json(docs)
  })

  app.get('/api/posts', (c) => {
    const limit = int(c.req.query('limit'), 1, 50, 24)
    const afterDate = c.req.query('afterDate')
    const afterId = c.req.query('afterId')
    const after = afterDate !== undefined && afterId ? { date: afterDate, id: afterId } : undefined
    return c.json({ posts: listPublishedPosts(db, limit, after) })
  })

  app.get('/api/posts/:id', (c) => {
    const post = getPost(db, c.req.param('id'))
    return post?.published ? c.json(post) : c.json({ error: 'not_found' }, 404)
  })

  app.post('/api/bookings', bodyLimit({ maxSize: 16 * KB, onError: tooLarge }), async (c) => {
    const ip = clientIp(c)
    for (const [limiter, key] of [
      [limits.booking, ip],
      [limits.bookingDaily, ip],
      [limits.bookingTotal, 'all'],
    ] as const) {
      if (!limiter.take(key, now())) return rateLimited(c, limiter.retryAfter(key, now()))
    }
    const request = parseBookingRequest(await readJson(c))
    if (!request) return c.json({ error: 'invalid' }, 400)
    // Two days of slack for guests in time zones behind the server.
    const errors = validateBooking(request, addDaysIso(todayIso(new Date(now())), -2))
    if (Object.keys(errors).length) return c.json({ error: 'invalid', fields: errors }, 400)
    // The room name comes from the site content, not from the request.
    const rooms = normalizeListDoc('rooms', getContent(db, 'rooms')?.data)
    const room = rooms.find((r) => r.visible && r.id === request.roomId)
    const roomName = room ? room.name[request.lang] || room.name.ru || room.name.en || room.name.uz : ''
    const booking = createBooking(
      db,
      cleanBooking({ ...request, roomId: room?.id ?? '', roomName: roomName.slice(0, BOOKING_LIMITS.roomName) }),
      now(),
    )
    events.emit('booking-created', booking)
    events.emit('bookings')
    return c.json({ id: booking.id }, 201)
  })

  // --- Sign-in ----------------------------------------------------------------------------------

  app.post('/api/auth/login', bodyLimit({ maxSize: 4 * KB, onError: tooLarge }), async (c) => {
    const body = await readJson(c)
    const email = isObject(body) && typeof body.email === 'string' ? normalizeEmail(body.email) : ''
    const password = isObject(body) && typeof body.password === 'string' ? body.password : ''
    const ip = clientIp(c)
    if (!limits.login.take(ip, now())) return rateLimited(c, limits.login.retryAfter(ip, now()))
    if (!limits.loginEmail.take(email, now())) return rateLimited(c, limits.loginEmail.retryAfter(email, now()))
    const admin = email ? findAdminByEmail(db, email) : null
    const valid = await verifyPassword(password, admin?.passwordHash ?? (await dummyHash()))
    if (!admin || !valid) return c.json({ error: 'invalid_credentials' }, 401)
    limits.loginEmail.reset(email)
    setSessionCookie(c, createSession(db, admin.id, now()))
    return c.json({ email: admin.email })
  })

  app.post('/api/auth/logout', (c) => {
    const token = getCookie(c, SESSION_COOKIE)
    if (token) deleteSession(db, token)
    deleteCookie(c, SESSION_COOKIE, { path: '/' })
    return c.json({ ok: true })
  })

  app.get('/api/auth/me', (c) => {
    const token = getCookie(c, SESSION_COOKIE)
    const session = token ? findSession(db, token, now()) : null
    return session ? c.json({ email: session.email }) : c.json({ error: 'unauthorized' }, 401)
  })

  // --- Admin API --------------------------------------------------------------------------------

  app.use('/api/admin/*', async (c, next) => {
    const token = getCookie(c, SESSION_COOKIE)
    const session = token ? findSession(db, token, now()) : null
    if (!token || !session) return c.json({ error: 'unauthorized' }, 401)
    c.set('admin', { id: session.adminId, email: session.email })
    c.set('token', token)
    await next()
  })

  app.get('/api/admin/content/:key', (c) => {
    const key = c.req.param('key')
    if (!isContentKey(key)) return c.json({ error: 'not_found' }, 404)
    return c.json(getContent(db, key) ?? { data: null, version: 0 })
  })

  app.put('/api/admin/content/:key', bodyLimit({ maxSize: 2048 * KB, onError: tooLarge }), async (c) => {
    const key = c.req.param('key')
    if (!isContentKey(key)) return c.json({ error: 'not_found' }, 404)
    const body = await readJson(c)
    if (!isObject(body) || !Number.isInteger(body.version)) return c.json({ error: 'invalid' }, 400)
    const result = saveContent(db, key, body.data, body.version as number, c.get('admin').email, now())
    if (!result.ok) return c.json({ error: 'conflict', current: result.current }, 409)
    events.emit(`content:${key}`, { version: result.version })
    return c.json({ data: result.data, version: result.version })
  })

  app.get('/api/admin/posts', (c) => c.json({ posts: listAllPosts(db) }))

  app.put('/api/admin/posts/:id', bodyLimit({ maxSize: 512 * KB, onError: tooLarge }), async (c) => {
    const id = c.req.param('id')
    if (!isPostId(id)) return c.json({ error: 'invalid_id' }, 400)
    const post = savePost(db, id, await readJson(c), c.get('admin').email, now())
    events.emit('posts')
    return c.json(post)
  })

  app.delete('/api/admin/posts/:id', (c) => {
    if (!deletePost(db, c.req.param('id'))) return c.json({ error: 'not_found' }, 404)
    events.emit('posts')
    return c.json({ ok: true })
  })

  app.get('/api/admin/bookings', (c) => {
    const status = c.req.query('status')
    const since = c.req.query('since')
    if (status !== undefined && !isBookingStatus(status)) return c.json({ error: 'invalid_status' }, 400)
    const filter: BookingFilter = {
      limit: int(c.req.query('limit'), 1, 1000, 200),
      status,
      since: since === undefined ? undefined : Number(since) || 0,
      checkInFrom: c.req.query('checkInFrom'),
      checkInTo: c.req.query('checkInTo'),
    }
    return c.json({ bookings: listBookings(db, filter) })
  })

  app.get('/api/admin/bookings/:id', (c) => {
    const booking = getBooking(db, c.req.param('id'))
    return booking ? c.json(booking) : c.json({ error: 'not_found' }, 404)
  })

  app.patch('/api/admin/bookings/:id', bodyLimit({ maxSize: 16 * KB, onError: tooLarge }), async (c) => {
    const body = await readJson(c)
    if (!isObject(body)) return c.json({ error: 'invalid' }, 400)
    const { status, note } = body
    if (status !== undefined && !isBookingStatus(status)) return c.json({ error: 'invalid_status' }, 400)
    if (note !== undefined && (typeof note !== 'string' || note.length > 2000)) return c.json({ error: 'invalid_note' }, 400)
    const booking = updateBooking(db, c.req.param('id'), { status, note }, c.get('admin').email, now())
    if (!booking) return c.json({ error: 'not_found' }, 404)
    events.emit('bookings')
    return c.json(booking)
  })

  app.delete('/api/admin/bookings/:id', (c) => {
    if (!deleteBooking(db, c.req.param('id'))) return c.json({ error: 'not_found' }, 404)
    events.emit('bookings')
    return c.json({ ok: true })
  })

  app.post('/api/admin/uploads', bodyLimit({ maxSize: MAX_UPLOAD_SIZE, onError: tooLarge }), async (c) => {
    const type = (c.req.header('content-type') ?? '').split(';')[0].trim().toLowerCase()
    try {
      const name = await saveUpload(uploadsDir, type, new Uint8Array(await c.req.arrayBuffer()), now())
      return c.json({ url: `/uploads/${name}` }, 201)
    } catch (error) {
      if (error instanceof UploadRejected) return c.json({ error: error.message }, 415)
      throw error
    }
  })

  app.get('/api/admin/uploads', async (c) => c.json({ uploads: await listUploads(uploadsDir) }))

  app.get('/api/admin/admins', (c) => {
    const me = c.get('admin').id
    return c.json({ admins: listAdmins(db).map((a) => ({ ...a, you: a.id === me })) })
  })

  app.post('/api/admin/admins', bodyLimit({ maxSize: 4 * KB, onError: tooLarge }), async (c) => {
    const body = await readJson(c)
    const email = isObject(body) && typeof body.email === 'string' ? normalizeEmail(body.email) : ''
    const password = isObject(body) && typeof body.password === 'string' ? body.password : ''
    if (!EMAIL.test(email)) return c.json({ error: 'invalid_email' }, 400)
    if (password.length < MIN_PASSWORD_LENGTH) return c.json({ error: 'weak_password' }, 400)
    const admin = createAdmin(db, email, await hashPassword(password), now())
    if (!admin) return c.json({ error: 'exists' }, 409)
    events.emit('admins')
    return c.json(admin, 201)
  })

  app.delete('/api/admin/admins/:id', (c) => {
    const id = Number(c.req.param('id'))
    if (id === c.get('admin').id) return c.json({ error: 'self' }, 400)
    if (!deleteAdmin(db, id)) return c.json({ error: 'not_found' }, 404)
    events.emit('admins')
    return c.json({ ok: true })
  })

  // For an admin who forgot their password: another admin sets a new one (and signs them out).
  app.post('/api/admin/admins/:id/password', bodyLimit({ maxSize: 4 * KB, onError: tooLarge }), async (c) => {
    const id = Number(c.req.param('id'))
    const body = await readJson(c)
    const password = isObject(body) && typeof body.password === 'string' ? body.password : ''
    if (password.length < MIN_PASSWORD_LENGTH) return c.json({ error: 'weak_password' }, 400)
    if (!listAdmins(db).some((a) => a.id === id)) return c.json({ error: 'not_found' }, 404)
    setPasswordHash(db, id, await hashPassword(password))
    deleteOtherSessions(db, id, id === c.get('admin').id ? c.get('token') : undefined)
    return c.json({ ok: true })
  })

  app.post('/api/admin/account/password', bodyLimit({ maxSize: 4 * KB, onError: tooLarge }), async (c) => {
    const body = await readJson(c)
    const current = isObject(body) && typeof body.currentPassword === 'string' ? body.currentPassword : ''
    const next = isObject(body) && typeof body.newPassword === 'string' ? body.newPassword : ''
    const admin = findAdminByEmail(db, c.get('admin').email)
    if (!admin || !(await verifyPassword(current, admin.passwordHash))) return c.json({ error: 'wrong_password' }, 400)
    if (next.length < MIN_PASSWORD_LENGTH) return c.json({ error: 'weak_password' }, 400)
    setPasswordHash(db, admin.id, await hashPassword(next))
    deleteOtherSessions(db, admin.id, c.get('token'))
    return c.json({ ok: true })
  })

  app.get('/api/admin/events', (c) => {
    const token = c.get('token')
    c.header('X-Accel-Buffering', 'no')
    return streamSSE(c, async (stream) => {
      const unsubscribe = events.subscribe((event, data) => {
        void stream.writeSSE({ event, data: JSON.stringify(data) }).catch(() => {})
      })
      stream.onAbort(unsubscribe)
      await stream.writeSSE({ event: 'ready', data: '{}' })
      // A comment every 25 s keeps proxies from closing an idle stream; stop once signed out.
      while (!stream.aborted && !stream.closed && findSession(db, token, now())) {
        await stream.sleep(25_000)
        if (stream.aborted) break
        await stream.write(': ping\n\n').catch(() => {})
      }
      unsubscribe()
    })
  })

  app.all('/api/*', (c) => c.json({ error: 'not_found' }, 404))

  // --- The site itself, for a local preview (in production Caddy serves these files) -----------

  if (config.staticDir) {
    const site = config.staticDir
    app.use('/uploads/*', serveStatic({ root: uploadsDir, rewriteRequestPath: (p) => p.replace(/^\/uploads/, '') }))
    app.use('*', serveStatic({ root: site }))
    app.get('*', serveStatic({ root: site, path: 'index.html' }))
  }

  return app
}
