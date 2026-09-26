import { normalizePost } from '../src/content/normalize'
import type { Post } from '../src/content/types'
import type { Db } from './db'

/** Ids are readable slugs made by the admin panel, e.g. "autumn-prices-2". */
export const isPostId = (id: string) => /^[a-z0-9][a-z0-9-]{0,79}$/.test(id)

type Row = { id: string; data: string }

const toPost = (row: Row): Post => normalizePost(row.id, JSON.parse(row.data))

export function getPost(db: Db, id: string): Post | null {
  const row = db.prepare('SELECT id, data FROM posts WHERE id = ?').get(id) as Row | undefined
  return row ? toPost(row) : null
}

/** Published posts, newest first; `after` is the last post of the previous page. */
export function listPublishedPosts(db: Db, limit: number, after?: { date: string; id: string }): Post[] {
  const rows = after
    ? db
        .prepare(
          `SELECT id, data FROM posts WHERE published = 1 AND (date < ? OR (date = ? AND id < ?))
           ORDER BY date DESC, id DESC LIMIT ?`,
        )
        .all(after.date, after.date, after.id, limit)
    : db.prepare('SELECT id, data FROM posts WHERE published = 1 ORDER BY date DESC, id DESC LIMIT ?').all(limit)
  return (rows as Row[]).map(toPost)
}

/** Every post, drafts included, newest first. */
export function listAllPosts(db: Db): Post[] {
  return (db.prepare('SELECT id, data FROM posts ORDER BY date DESC, id DESC').all() as Row[]).map(toPost)
}

export function savePost(db: Db, id: string, raw: unknown, editor: string, now: number): Post {
  const post = normalizePost(id, raw)
  db.prepare(
    `INSERT INTO posts (id, data, published, date, updated_at, updated_by) VALUES (?, ?, ?, ?, ?, ?)
     ON CONFLICT (id) DO UPDATE SET data = excluded.data, published = excluded.published, date = excluded.date,
       updated_at = excluded.updated_at, updated_by = excluded.updated_by`,
  ).run(id, JSON.stringify({ ...post, id: undefined }), post.published ? 1 : 0, post.date, now, editor)
  return post
}

export function deletePost(db: Db, id: string): boolean {
  return Number(db.prepare('DELETE FROM posts WHERE id = ?').run(id).changes) > 0
}
