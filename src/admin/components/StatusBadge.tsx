import type { BookingStatus } from '../../content/types'
import { STATUS_LABELS } from '../lib/bookings'

export function StatusBadge({ status }: { status: BookingStatus }) {
  return <span className={`a-badge a-badge--${status}`}>{STATUS_LABELS[status]}</span>
}
