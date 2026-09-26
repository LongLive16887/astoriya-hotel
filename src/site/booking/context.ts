import { createContext, useContext } from 'react'

export interface BookingPrefill {
  checkIn?: string
  checkOut?: string
  adults?: number
  children?: number
  roomId?: string
}

export const BookingContext = createContext<(prefill?: BookingPrefill) => void>(() => {})

/** Returns a function that opens the booking form, optionally pre-filled. */
export function useOpenBooking() {
  return useContext(BookingContext)
}
