// Starts the API (with a local database in ./data) and the Vite dev server together.
import { spawn } from 'node:child_process'

const children = [
  spawn('npx', ['tsx', 'watch', 'server/main.ts'], { stdio: 'inherit', env: { ...process.env, DATA_DIR: process.env.DATA_DIR || 'data' } }),
  spawn('npx', ['vite'], { stdio: 'inherit' }),
]
const stop = (code = 0) => {
  for (const child of children) child.kill()
  process.exit(code)
}
for (const child of children) child.on('exit', (code) => stop(code ?? 1))
process.on('SIGINT', () => stop())
process.on('SIGTERM', () => stop())
