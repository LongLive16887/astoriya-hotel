import { DatabaseSync } from 'node:sqlite'

export type Db = DatabaseSync

/**
 * Schema changes, applied once each and in order. Never edit an entry that has been
 * released: add a new one instead.
 */
const MIGRATIONS = [
  `
  CREATE TABLE admins (
    id INTEGER PRIMARY KEY,
    email TEXT NOT NULL UNIQUE COLLATE NOCASE,
    password_hash TEXT NOT NULL,
    created_at INTEGER NOT NULL
  );
  CREATE TABLE sessions (
    token_hash TEXT PRIMARY KEY,
    admin_id INTEGER NOT NULL REFERENCES admins (id) ON DELETE CASCADE,
    created_at INTEGER NOT NULL,
    expires_at INTEGER NOT NULL
  );
  CREATE TABLE content (
    key TEXT PRIMARY KEY,
    data TEXT NOT NULL,
    version INTEGER NOT NULL,
    updated_at INTEGER NOT NULL,
    updated_by TEXT NOT NULL DEFAULT ''
  );
  CREATE TABLE posts (
    id TEXT PRIMARY KEY,
    data TEXT NOT NULL,
    published INTEGER NOT NULL,
    date TEXT NOT NULL,
    updated_at INTEGER NOT NULL,
    updated_by TEXT NOT NULL DEFAULT ''
  );
  CREATE INDEX posts_feed ON posts (published, date DESC, id DESC);
  CREATE TABLE bookings (
    id TEXT PRIMARY KEY,
    status TEXT NOT NULL,
    name TEXT NOT NULL,
    phone TEXT NOT NULL,
    email TEXT NOT NULL,
    check_in TEXT NOT NULL,
    check_out TEXT NOT NULL,
    adults INTEGER NOT NULL,
    children INTEGER NOT NULL,
    room_id TEXT NOT NULL,
    room_name TEXT NOT NULL,
    message TEXT NOT NULL,
    lang TEXT NOT NULL,
    note TEXT NOT NULL DEFAULT '',
    created_at INTEGER NOT NULL,
    updated_at INTEGER,
    updated_by TEXT
  );
  CREATE INDEX bookings_created ON bookings (created_at DESC);
  CREATE INDEX bookings_status ON bookings (status, created_at DESC);
  CREATE INDEX bookings_check_in ON bookings (check_in);
  `,
]

export function openDb(file: string): Db {
  const db = new DatabaseSync(file)
  db.exec(`
    PRAGMA journal_mode = WAL;
    PRAGMA synchronous = NORMAL;
    PRAGMA foreign_keys = ON;
    PRAGMA busy_timeout = 5000;
  `)
  migrate(db)
  return db
}

export function transaction<T>(db: Db, run: () => T): T {
  db.exec('BEGIN IMMEDIATE')
  try {
    const result = run()
    db.exec('COMMIT')
    return result
  } catch (error) {
    db.exec('ROLLBACK')
    throw error
  }
}

export function getMeta(db: Db, key: string): string | null {
  const row = db.prepare('SELECT value FROM meta WHERE key = ?').get(key) as { value: string } | undefined
  return row?.value ?? null
}

export function setMeta(db: Db, key: string, value: string) {
  db.prepare('INSERT INTO meta (key, value) VALUES (?, ?) ON CONFLICT (key) DO UPDATE SET value = excluded.value').run(key, value)
}

function migrate(db: Db) {
  db.exec('CREATE TABLE IF NOT EXISTS meta (key TEXT PRIMARY KEY, value TEXT NOT NULL)')
  const applied = Number(getMeta(db, 'schema_version') ?? 0)
  MIGRATIONS.slice(applied).forEach((sql, i) =>
    transaction(db, () => {
      db.exec(sql)
      setMeta(db, 'schema_version', String(applied + i + 1))
    }),
  )
}
