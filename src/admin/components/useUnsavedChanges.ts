import { useEffect, useRef } from 'react'
import { useBlocker } from 'react-router-dom'
import { useConfirm } from './feedback'

/**
 * Warns before leaving a form with unsaved changes (in-app navigation and closing the tab).
 * Call `allowLeave()` right before navigating away after a successful save.
 */
export function useUnsavedChanges(dirty: boolean) {
  const confirm = useConfirm()
  const leaving = useRef(false)
  const blocker = useBlocker(
    ({ currentLocation, nextLocation }) =>
      dirty && !leaving.current && currentLocation.pathname !== nextLocation.pathname,
  )

  useEffect(() => {
    if (blocker.state !== 'blocked') return
    void confirm({
      title: 'Уйти без сохранения?',
      text: 'Изменения на этой странице не сохранены и будут потеряны.',
      confirmLabel: 'Уйти',
      danger: true,
    }).then((ok) => (ok ? blocker.proceed() : blocker.reset()))
  }, [blocker, confirm])

  useEffect(() => {
    if (!dirty) return
    const onBeforeUnload = (event: BeforeUnloadEvent) => event.preventDefault()
    window.addEventListener('beforeunload', onBeforeUnload)
    return () => window.removeEventListener('beforeunload', onBeforeUnload)
  }, [dirty])

  return {
    allowLeave: () => {
      leaving.current = true
    },
  }
}
