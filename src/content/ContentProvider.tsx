import { useEffect, useState, type ReactNode } from 'react'
import { readCache, writeCache } from '../lib/cache'
import { fetchContentDocs } from '../lib/publicApi'
import { ContentContext, type ContentState } from './context'
import { DEFAULT_CONTENT } from './defaults'
import { normalizeContent } from './normalize'
import type { ContentKey } from './types'

const CACHE_KEY = 'content'
/** How long the first visit waits for the server before showing the built-in content. */
const FIRST_LOAD_TIMEOUT = 3500

type RawDocs = Partial<Record<ContentKey, unknown>>

function initialState(): ContentState {
  const cached = readCache<RawDocs>(CACHE_KEY)
  if (cached) return { content: normalizeContent(cached, DEFAULT_CONTENT), status: 'ready' }
  return { content: DEFAULT_CONTENT, status: 'loading' }
}

/**
 * Provides the site content: instantly from the local cache on repeat visits,
 * then refreshed from the server in the background.
 */
export function ContentProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState(initialState)

  useEffect(() => {
    let active = true
    const timer = window.setTimeout(() => {
      if (active) setState((s) => (s.status === 'loading' ? { ...s, status: 'ready' } : s))
    }, FIRST_LOAD_TIMEOUT)

    fetchContentDocs()
      .then((docs) => {
        writeCache(CACHE_KEY, docs)
        if (active) setState({ content: normalizeContent(docs, DEFAULT_CONTENT), status: 'ready' })
      })
      .catch((error: unknown) => {
        console.warn('Could not load site content, using the built-in version.', error)
        if (active) setState((s) => ({ ...s, status: 'ready' }))
      })
      .finally(() => window.clearTimeout(timer))

    return () => {
      active = false
      window.clearTimeout(timer)
    }
  }, [])

  return <ContentContext.Provider value={state}>{children}</ContentContext.Provider>
}
