import { createContext, useContext } from 'react'
import { DEFAULT_CONTENT } from './defaults'
import type { SiteContent } from './types'

export interface ContentState {
  content: SiteContent
  /** "loading" only on the very first visit, while nothing is cached yet. */
  status: 'loading' | 'ready'
}

export const ContentContext = createContext<ContentState>({
  content: DEFAULT_CONTENT,
  status: 'ready',
})

export function useContent(): SiteContent {
  return useContext(ContentContext).content
}

export function useContentStatus(): ContentState['status'] {
  return useContext(ContentContext).status
}
