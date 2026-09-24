import { useEffect, useRef } from 'react'
import { useLocation, useNavigationType } from 'react-router-dom'

/** Scrolls to the top on page changes and to #section links (retrying while the page renders). */
export function ScrollManager() {
  const { pathname, hash, key } = useLocation()
  const navigationType = useNavigationType()
  const firstRender = useRef(true)

  useEffect(() => {
    const isFirst = firstRender.current
    firstRender.current = false
    // Back/forward: the browser restores the previous position itself.
    if (navigationType === 'POP' && !isFirst) return

    if (!hash) {
      if (!isFirst) window.scrollTo({ top: 0, left: 0, behavior: 'instant' })
      return
    }

    const id = decodeURIComponent(hash.slice(1))
    let attempts = 0
    let frame = 0
    const tryScroll = () => {
      const target = document.getElementById(id)
      if (target) {
        target.scrollIntoView({ behavior: isFirst ? 'instant' : 'smooth', block: 'start' })
      } else if (attempts++ < 30) {
        frame = requestAnimationFrame(tryScroll)
      }
    }
    tryScroll()
    return () => cancelAnimationFrame(frame)
  }, [pathname, hash, key, navigationType])

  return null
}
