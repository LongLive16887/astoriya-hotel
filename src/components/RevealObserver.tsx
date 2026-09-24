import { useEffect } from 'react'

/**
 * Fades in every element with the `reveal` class when it scrolls into view.
 * One observer for the whole page; elements added later (e.g. after filtering) are picked up too.
 */
export function RevealObserver() {
  useEffect(() => {
    const root = document.documentElement
    if (!('IntersectionObserver' in window)) {
      root.classList.add('no-reveal')
      return
    }

    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue
          entry.target.classList.add('is-visible')
          io.unobserve(entry.target)
        }
      },
      { rootMargin: '0px 0px -6% 0px', threshold: 0.08 },
    )

    const observeWithin = (node: ParentNode) => {
      node.querySelectorAll('.reveal:not(.is-visible)').forEach((el) => io.observe(el))
    }

    observeWithin(document)
    const mo = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        mutation.addedNodes.forEach((node) => {
          if (!(node instanceof Element)) return
          if (node.matches('.reveal:not(.is-visible)')) io.observe(node)
          observeWithin(node)
        })
      }
    })
    mo.observe(document.body, { childList: true, subtree: true })

    return () => {
      io.disconnect()
      mo.disconnect()
    }
  }, [])

  return null
}
