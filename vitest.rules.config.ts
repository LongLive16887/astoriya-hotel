import { defineConfig } from 'vitest/config'

// Security rules tests; they need the Firebase emulators (see `npm run test:rules`).
export default defineConfig({
  test: {
    include: ['tests/rules/**/*.test.ts'],
    environment: 'node',
    testTimeout: 20_000,
    hookTimeout: 30_000,
    fileParallelism: false,
  },
})
