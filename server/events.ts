/**
 * Changes the admin panel listens to over Server-Sent Events:
 * "content:<key>", "posts", "bookings" and "booking-created" (a request from a guest).
 */
export class EventHub {
  private readonly listeners = new Set<(event: string, data: unknown) => void>()

  subscribe(listener: (event: string, data: unknown) => void): () => void {
    this.listeners.add(listener)
    return () => this.listeners.delete(listener)
  }

  emit(event: string, data: unknown = {}) {
    for (const listener of this.listeners) listener(event, data)
  }
}
