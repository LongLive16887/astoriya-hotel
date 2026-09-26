import { createContext, useContext } from 'react'
import type { Booking } from '../lib/bookings'

/** Requests with status "new", shared from the layout so pages do not subscribe twice. */
export const NewBookingsContext = createContext<Booking[]>([])

export const useNewBookingsList = () => useContext(NewBookingsContext)
