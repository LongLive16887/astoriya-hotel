import { createHash, randomBytes, scrypt, timingSafeEqual } from 'node:crypto'
import type { Db } from './db'

// --- Passwords ------------------------------------------------------------------------------

const SCRYPT = { N: 32768, r: 8, p: 1 }
const KEY_LENGTH = 64
const MAX_MEMORY = 64 * 1024 * 1024

export const MIN_PASSWORD_LENGTH = 8

function derive(password: string, salt: Buffer, N: number, r: number, p: number): Promise<Buffer> {
  return new Promise((resolve, reject) =>
    scrypt(password.normalize('NFKC'), salt, KEY_LENGTH, { N, r, p, maxmem: MAX_MEMORY }, (error, key) =>
      error ? reject(error) : resolve(key),
    ),
  )
}

/** "scrypt$N$r$p$salt$key", salt and key in base64. */
export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16)
  const key = await derive(password, salt, SCRYPT.N, SCRYPT.r, SCRYPT.p)
  return ['scrypt', SCRYPT.N, SCRYPT.r, SCRYPT.p, salt.toString('base64'), key.toString('base64')].join('$')
}

export const isPasswordHash = (value: string) => /^scrypt\$\d+\$\d+\$\d+\$[A-Za-z0-9+/=]+\$[A-Za-z0-9+/=]+$/.test(value)

export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  if (!isPasswordHash(stored)) return false
  const [, N, r, p, salt, key] = stored.split('$')
  const expected = Buffer.from(key, 'base64')
  const actual = await derive(password, Buffer.from(salt, 'base64'), Number(N), Number(r), Number(p))
  return actual.length === expected.length && timingSafeEqual(actual, expected)
}

let dummy: Promise<string> | null = null

/** Checked against when the email is unknown, so that the answer takes as long as for a real account. */
export const dummyHash = () => (dummy ??= hashPassword(randomBytes(16).toString('hex')))

// --- Admin accounts ---------------------------------------------------------------------------

export const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
export const normalizeEmail = (value: string) => value.trim().toLowerCase()

export interface Admin {
  id: number
  email: string
  createdAt: number
}

export function findAdminByEmail(db: Db, email: string): (Admin & { passwordHash: string }) | null {
  const row = db
    .prepare('SELECT id, email, password_hash, created_at FROM admins WHERE email = ?')
    .get(normalizeEmail(email)) as { id: number; email: string; password_hash: string; created_at: number } | undefined
  return row ? { id: row.id, email: row.email, createdAt: row.created_at, passwordHash: row.password_hash } : null
}

export function listAdmins(db: Db): Admin[] {
  const rows = db.prepare('SELECT id, email, created_at FROM admins ORDER BY created_at').all() as {
    id: number
    email: string
    created_at: number
  }[]
  return rows.map((r) => ({ id: r.id, email: r.email, createdAt: r.created_at }))
}

/** Adds an admin; `passwordHash` comes from hashPassword. Returns null when the email is taken. */
export function createAdmin(db: Db, email: string, passwordHash: string, now: number): Admin | null {
  const normalized = normalizeEmail(email)
  if (findAdminByEmail(db, normalized)) return null
  const result = db
    .prepare('INSERT INTO admins (email, password_hash, created_at) VALUES (?, ?, ?)')
    .run(normalized, passwordHash, now)
  return { id: Number(result.lastInsertRowid), email: normalized, createdAt: now }
}

export function setPasswordHash(db: Db, adminId: number, passwordHash: string) {
  db.prepare('UPDATE admins SET password_hash = ? WHERE id = ?').run(passwordHash, adminId)
}

export function deleteAdmin(db: Db, adminId: number): boolean {
  return Number(db.prepare('DELETE FROM admins WHERE id = ?').run(adminId).changes) > 0
}

// --- Sessions ---------------------------------------------------------------------------------

export const SESSION_COOKIE = 'astoria_session'
export const SESSION_TTL = 30 * 24 * 60 * 60 * 1000

/** Only a hash of the token is stored, so a copy of the database does not let anyone in. */
const tokenHash = (token: string) => createHash('sha256').update(token).digest('hex')

export function createSession(db: Db, adminId: number, now: number): string {
  const token = randomBytes(32).toString('base64url')
  db.prepare('INSERT INTO sessions (token_hash, admin_id, created_at, expires_at) VALUES (?, ?, ?, ?)').run(
    tokenHash(token),
    adminId,
    now,
    now + SESSION_TTL,
  )
  return token
}

export function findSession(db: Db, token: string, now: number): { adminId: number; email: string } | null {
  const row = db
    .prepare(
      `SELECT admins.id AS id, admins.email AS email FROM sessions
       JOIN admins ON admins.id = sessions.admin_id
       WHERE sessions.token_hash = ? AND sessions.expires_at > ?`,
    )
    .get(tokenHash(token), now) as { id: number; email: string } | undefined
  return row ? { adminId: row.id, email: row.email } : null
}

export function deleteSession(db: Db, token: string) {
  db.prepare('DELETE FROM sessions WHERE token_hash = ?').run(tokenHash(token))
}

/** Signs the admin out everywhere except the session `keepToken` (after a password change). */
export function deleteOtherSessions(db: Db, adminId: number, keepToken?: string) {
  db.prepare('DELETE FROM sessions WHERE admin_id = ? AND token_hash != ?').run(adminId, keepToken ? tokenHash(keepToken) : '')
}

export function pruneSessions(db: Db, now: number) {
  db.prepare('DELETE FROM sessions WHERE expires_at <= ?').run(now)
}
