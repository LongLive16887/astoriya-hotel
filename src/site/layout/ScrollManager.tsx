import { useEffect, useRef } from 'react'
import { useLocation, useNavigationType } from 'react-router-dom'

// Scroll position of every visited history entry, so "Back" returns to the same place.
const positions = new Map<string, number>()

/** Retries for up to ~half a second while the page is still rendering. */
function retry(attempt: () => boolean): () => void {
  let frame = 0
  let left = 30
  const run = () => {
    if (!attempt() && left-- > 0) frame = requestAnimationFrame(run)
  }
  run()
  return () => cancelAnimationFrame(frame)
}

/** Scroll handling for the public site: top on new pages, #section links, restore on Back/Forward. */
export function ScrollManager() {
  const { pathname, hash, key } = useLocation()
  const navigationType = useNavigationType()
  const firstRender = useRef(true)

  useEffect(() => {
    if ('scrollRestoration' in history) history.scrollRestoration = 'manual'
    let frame = 0
    const onScroll = () => {
      cancelAnimationFrame(frame)
      // The router's key of the entry being shown; read at event time because the browser
      // also scrolls while a new page replaces the old one, which must not overwrite its position.
      frame = requestAnimationFrame(() => {
        const state = history.state as { key?: string } | null
        positions.set(state?.key ?? 'default', window.scrollY)
      })
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => {
      window.removeEventListener('scroll', onScroll)
      cancelAnimationFrame(frame)
    }
  }, [])

  useEffect(() => {
    const isFirst = firstRender.current
    firstRender.current = false

    const saved = positions.get(key)
    if (navigationType === 'POP' && !isFirst && saved !== undefined) {
      return retry(() => {
        window.scrollTo({ top: saved, behavior: 'instant' })
        return Math.abs(window.scrollY - saved) < 2
      })
    }

    if (!hash) {
      if (!isFirst) window.scrollTo({ top: 0, left: 0, behavior: 'instant' })
      return
    }

    const id = decodeURIComponent(hash.slice(1))
    return retry(() => {
      const target = document.getElementById(id)
      target?.scrollIntoView({ behavior: isFirst ? 'instant' : 'smooth', block: 'start' })
      return Boolean(target)
    })
  }, [pathname, hash, key, navigationType])

  return null
}
