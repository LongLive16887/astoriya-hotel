const PREFIX = 'astoria:cache:v1:'

/** Reads a JSON value saved with writeCache; null when missing, broken or storage is blocked. */
export function readCache<T>(key: string): T | null {
  try {
    const raw = localStorage.getItem(PREFIX + key)
    return raw ? (JSON.parse(raw) as T) : null
  } catch {
    return null
  }
}

export function writeCache(key: string, value: unknown) {
  try {
    localStorage.setItem(PREFIX + key, JSON.stringify(value))
  } catch {
    // Quota exceeded or storage disabled: the cache is only an optimisation.
  }
}
