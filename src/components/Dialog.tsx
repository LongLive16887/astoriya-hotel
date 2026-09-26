import { useEffect, useRef, type ReactNode } from 'react'
import './Dialog.css'

interface DialogProps {
  open: boolean
  onClose: () => void
  /** Accessible name: id of the heading inside, or a plain label. */
  labelledBy?: string
  label?: string
  className?: string
  children: ReactNode
}

/**
 * Modal built on the native <dialog>: the browser handles focus trapping,
 * the Escape key and making the rest of the page inert.
 */
export function Dialog({ open, onClose, labelledBy, label, className = '', children }: DialogProps) {
  const ref = useRef<HTMLDialogElement>(null)
  const returnFocus = useRef<HTMLElement | null>(null)
  const pressedOnBackdrop = useRef(false)

  useEffect(() => {
    const dialog = ref.current
    if (!dialog) return
    if (open && !dialog.open) {
      returnFocus.current = document.activeElement as HTMLElement | null
      dialog.showModal()
    } else if (!open && dialog.open) {
      dialog.close()
      returnFocus.current?.focus?.()
    }
  }, [open])

  return (
    <dialog
      ref={ref}
      className={`dialog ${className}`}
      aria-labelledby={labelledBy}
      aria-label={label}
      onCancel={(event) => {
        event.preventDefault()
        onClose()
      }}
      onPointerDown={(event) => {
        pressedOnBackdrop.current = event.target === event.currentTarget
      }}
      onClick={(event) => {
        // A click on the <dialog> itself (not its content) is a click on the backdrop. It must also
        // start there: selecting text in a field and releasing the mouse outside is not a click away.
        if (event.target === event.currentTarget && pressedOnBackdrop.current) onClose()
      }}
    >
      {open && children}
    </dialog>
  )
}
