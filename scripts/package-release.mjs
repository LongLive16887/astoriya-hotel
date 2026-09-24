// Packs the built site and server into release/astoria-<commit>.tar.gz for the server's deploy agent.
import { execFileSync } from 'node:child_process'
import { createHash } from 'node:crypto'
import { cpSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'

const sha = process.env.GITHUB_SHA || execFileSync('git', ['rev-parse', 'HEAD']).toString().trim()
const root = 'release/astoria'
rmSync('release', { recursive: true, force: true })
mkdirSync(root, { recursive: true })
cpSync('dist', `${root}/dist`, { recursive: true })
cpSync('build/server', `${root}/server`, { recursive: true })
writeFileSync(`${root}/VERSION`, `${sha}\n`)

const name = `astoria-${sha}.tar.gz`
execFileSync('tar', ['-czf', `release/${name}`, '-C', 'release', 'astoria'])
const sum = createHash('sha256').update(readFileSync(`release/${name}`)).digest('hex')
writeFileSync(`release/${name}.sha256`, `${sum}  ${name}\n`)
writeFileSync('release/version.txt', `${sha}\n`)
rmSync(root, { recursive: true })
console.log(`release/${name} (${sum.slice(0, 12)}…)`)
