import { useCallback, useState, type ReactNode } from 'react'
import { BookingDialog } from './BookingDialog'
import { BookingContext, type BookingPrefill } from './context'

export function BookingProvider({ children }: { children: ReactNode }) {
  const [prefill, setPrefill] = useState<BookingPrefill | null>(null)
  const open = useCallback((values: BookingPrefill = {}) => setPrefill(values), [])

  return (
    <BookingContext.Provider value={open}>
      {children}
      <BookingDialog prefill={prefill} onClose={() => setPrefill(null)} />
    </BookingContext.Provider>
  )
}
