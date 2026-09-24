import { randomBytes } from 'node:crypto'
import { mkdirSync, readdirSync, rmSync } from 'node:fs'
import path from 'node:path'
import { serve } from '@hono/node-server'
import { createApp } from './app'
import {
  EMAIL,
  createAdmin,
  deleteOtherSessions,
  findAdminByEmail,
  hashPassword,
  isPasswordHash,
  listAdmins,
  pruneSessions,
  setPasswordHash,
} from './auth'
import { loadConfig } from './config'
import { seedContent } from './content'
import { openDb } from './db'

const USAGE = `Astoria server

  node server/index.mjs                                 start the server
  node server/index.mjs admin:add <email> [password-hash]
                                                        add an admin; without a hash a password is generated and printed
  node server/index.mjs admin:password <email>          set a new generated password (signs the admin out everywhere)
  node server/index.mjs admin:list                      list admins
  node server/index.mjs backup [keep]                   copy the database to backups/ (keeps the last 14 copies)

Settings come from environment variables: PORT, HOST, DATA_DIR, TRUST_PROXY, STATIC_DIR.`

const config = loadConfig()
const dirs = {
  uploads: path.join(config.dataDir, 'uploads'),
  backups: path.join(config.dataDir, 'backups'),
}
for (const dir of [config.dataDir, dirs.uploads, dirs.backups]) mkdirSync(dir, { recursive: true })

const db = openDb(path.join(config.dataDir, 'astoria.db'))
const [command = 'serve', ...args] = process.argv.slice(2)

/** 16 letters and digits without look-alikes (0/O, 1/l/I): about 93 bits. */
const PASSWORD_ALPHABET = 'abcdefghijkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789'
const generatePassword = () => Array.from(randomBytes(16), (b) => PASSWORD_ALPHABET[b % PASSWORD_ALPHABET.length]).join('')

function fail(message: string): never {
  console.error(message)
  process.exit(1)
}

switch (command) {
  case 'serve': {
    if (seedContent(db, Date.now())) console.log('New database: added the built-in content and sample news')
    if (listAdmins(db).length === 0) console.warn('No admins yet: add one with "admin:add <email>"')
    const app = createApp({ db, config })
    const server = serve({ fetch: app.fetch, port: config.port, hostname: config.host }, (info) =>
      console.log(`Astoria ${config.version} listening on http://${info.address}:${info.port}, data in ${config.dataDir}`),
    )
    const cleanup = setInterval(() => pruneSessions(db, Date.now()), 60 * 60 * 1000)
    const stop = () => {
      clearInterval(cleanup)
      server.close(() => {
        db.close()
        process.exit(0)
      })
      // Open event streams from the admin panel would keep the server waiting.
      setTimeout(() => process.exit(0), 3000).unref()
    }
    process.on('SIGTERM', stop)
    process.on('SIGINT', stop)
    break
  }

  case 'admin:add': {
    const [email, hash] = args
    if (!email || !EMAIL.test(email)) fail('Usage: admin:add <email> [password-hash]')
    if (hash && !isPasswordHash(hash)) fail('The password hash is not in the scrypt$N$r$p$salt$key format')
    const password = hash ? null : generatePassword()
    const admin = createAdmin(db, email, hash ?? (await hashPassword(password!)), Date.now())
    if (!admin) fail(`${email} is already an admin`)
    console.log(password ? `Added ${admin.email}, password: ${password}` : `Added ${admin.email}`)
    break
  }

  case 'admin:password': {
    const admin = findAdminByEmail(db, args[0] ?? '')
    if (!admin) fail(`No admin with the email ${args[0] ?? ''}`)
    const password = generatePassword()
    setPasswordHash(db, admin.id, await hashPassword(password))
    deleteOtherSessions(db, admin.id)
    console.log(`New password for ${admin.email}: ${password}`)
    break
  }

  case 'admin:list':
    for (const admin of listAdmins(db)) console.log(`${admin.email}\tadded ${new Date(admin.createdAt).toISOString()}`)
    break

  case 'backup': {
    const keep = Math.max(1, Number(args[0]) || 14)
    const stamp = new Date().toISOString().replace(/[-:]/g, '').replace('T', '-').slice(0, 15)
    const file = path.join(dirs.backups, `astoria-${stamp}.db`)
    db.exec(`VACUUM INTO '${file.replaceAll("'", "''")}'`)
    const old = readdirSync(dirs.backups)
      .filter((name) => /^astoria-\d{8}-\d{6}\.db$/.test(name))
      .sort()
      .slice(0, -keep)
    for (const name of old) rmSync(path.join(dirs.backups, name))
    console.log(`Backup saved to ${file}${old.length ? `, removed ${old.length} old copies` : ''}`)
    break
  }

  default:
    console.log(USAGE)
    process.exit(command === 'help' || command === '--help' ? 0 : 1)
}

if (command !== 'serve') db.close()
