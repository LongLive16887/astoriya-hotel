import { existsSync, readFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

export interface Config {
  port: number
  host: string
  /** The database, uploaded photos and backups live here. */
  dataDir: string
  /** Behind Caddy on the same machine: take the client address and scheme from X-Forwarded-* headers. */
  trustProxy: boolean
  /** Also serve the built site from this folder (local preview; in production Caddy does it). */
  staticDir: string | null
  /** Commit the running release was built from, reported by /api/health. */
  version: string
}

/** The release packaging puts a VERSION file next to the server folder. */
function releaseVersion(): string | null {
  const file = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'VERSION')
  return existsSync(file) ? readFileSync(file, 'utf8').trim() : null
}

export function loadConfig(env: NodeJS.ProcessEnv = process.env): Config {
  return {
    port: Number(env.PORT) || 3001,
    host: env.HOST || '127.0.0.1',
    dataDir: path.resolve(env.DATA_DIR || 'data'),
    trustProxy: env.TRUST_PROXY === '1',
    staticDir: env.STATIC_DIR ? path.resolve(env.STATIC_DIR) : null,
    version: env.APP_VERSION || releaseVersion() || 'dev',
  }
}
