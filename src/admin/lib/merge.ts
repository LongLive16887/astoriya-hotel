const isPlainObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value)

/**
 * Three-way merge for forms: applies the edits made from `base` (what the form was opened with)
 * to `draft` on top of `current`, a newer stored copy. Saving then does not undo what another
 * admin or another tab changed meanwhile in fields this form did not touch.
 * Objects are merged key by key; arrays and other values are replaced as a whole.
 */
export function mergeEdits<T>(current: T, base: T, draft: T): T {
  if (isPlainObject(current) && isPlainObject(base) && isPlainObject(draft)) {
    const merged: Record<string, unknown> = { ...current }
    for (const key of Object.keys(draft)) merged[key] = mergeEdits(current[key], base[key], draft[key])
    return merged as T
  }
  return JSON.stringify(draft) === JSON.stringify(base) ? current : draft
}
