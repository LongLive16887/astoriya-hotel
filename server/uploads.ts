import { randomBytes } from 'node:crypto'
import { readdir, stat, writeFile } from 'node:fs/promises'
import path from 'node:path'

/** Limit per photo; the admin panel shrinks photos to WebP well below it. */
export const MAX_UPLOAD_SIZE = 10 * 1024 * 1024

const ascii = (bytes: Uint8Array, from: number, to: number) => String.fromCharCode(...bytes.subarray(from, to))

/**
 * Accepted formats and their file signatures. SVG is not accepted: served from the site's own
 * address, a crafted SVG could run scripts.
 */
const FORMATS: Record<string, { extension: string; matches: (bytes: Uint8Array) => boolean }> = {
  'image/webp': { extension: 'webp', matches: (b) => ascii(b, 0, 4) === 'RIFF' && ascii(b, 8, 12) === 'WEBP' },
  'image/jpeg': { extension: 'jpg', matches: (b) => b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff },
  'image/png': { extension: 'png', matches: (b) => ascii(b, 1, 4) === 'PNG' && b[0] === 0x89 },
  'image/gif': { extension: 'gif', matches: (b) => ascii(b, 0, 4) === 'GIF8' },
  'image/avif': { extension: 'avif', matches: (b) => ascii(b, 4, 8) === 'ftyp' && ['avif', 'avis'].includes(ascii(b, 8, 12)) },
}

export class UploadRejected extends Error {}

/** Saves a photo under a new random name and returns that name. */
export async function saveUpload(dir: string, contentType: string, bytes: Uint8Array, now: number): Promise<string> {
  const format = FORMATS[contentType]
  if (!format) throw new UploadRejected('unsupported_type')
  if (bytes.length === 0 || bytes.length > MAX_UPLOAD_SIZE) throw new UploadRejected('bad_size')
  if (!format.matches(bytes)) throw new UploadRejected('not_an_image')
  const name = `${new Date(now).toISOString().slice(0, 10)}-${randomBytes(6).toString('hex')}.${format.extension}`
  await writeFile(path.join(dir, name), bytes, { flag: 'wx' })
  return name
}

export interface UploadedFile {
  url: string
  size: number
  uploadedAt: number
}

/** Uploaded photos, newest first. */
export async function listUploads(dir: string): Promise<UploadedFile[]> {
  const names = (await readdir(dir)).filter((name) => /^[\w-]+\.(webp|jpg|png|gif|avif)$/.test(name))
  const files = await Promise.all(
    names.map(async (name) => {
      const info = await stat(path.join(dir, name))
      return { url: `/uploads/${name}`, size: info.size, uploadedAt: info.mtimeMs }
    }),
  )
  return files.sort((a, b) => b.uploadedAt - a.uploadedAt)
}
