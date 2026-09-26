/** Sliding-window limiter kept in memory: enough for a single server process. */
export class RateLimiter {
  private readonly hits = new Map<string, number[]>()
  private readonly limit: number
  private readonly windowMs: number

  constructor(limit: number, windowMs: number) {
    this.limit = limit
    this.windowMs = windowMs
  }

  /** Records an attempt; false when `key` has used up its attempts. */
  take(key: string, now = Date.now()): boolean {
    const recent = this.recent(key, now)
    if (recent.length >= this.limit) return false
    recent.push(now)
    this.hits.set(key, recent)
    if (this.hits.size > 10_000) this.prune(now)
    return true
  }

  /** Seconds until `key` may try again. */
  retryAfter(key: string, now = Date.now()): number {
    const recent = this.recent(key, now)
    return recent.length < this.limit ? 0 : Math.ceil((recent[0] + this.windowMs - now) / 1000)
  }

  reset(key: string) {
    this.hits.delete(key)
  }

  private recent(key: string, now: number): number[] {
    return (this.hits.get(key) ?? []).filter((t) => t > now - this.windowMs)
  }

  private prune(now: number) {
    for (const [key, times] of this.hits) {
      if (times.every((t) => t <= now - this.windowMs)) this.hits.delete(key)
    }
  }
}
