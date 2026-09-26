/** Error answered by the site's API; `status` 0 means the server could not be reached. */
export class ApiError extends Error {
  readonly status: number
  readonly code: string
  readonly body: unknown

  constructor(status: number, code: string, body: unknown = null) {
    super(code)
    this.status = status
    this.code = code
    this.body = body
  }
}

/** Fired when the admin API answers 401: the session has ended and the admin must sign in again. */
export const UNAUTHORIZED_EVENT = 'astoria:unauthorized'

export interface ApiInit extends RequestInit {
  /** Sent as the JSON body. */
  json?: unknown
}

/** Calls the API served from the site's own address and returns the parsed answer. */
export async function api<T = unknown>(path: string, { json, headers, ...init }: ApiInit = {}): Promise<T> {
  let res: Response
  try {
    res = await fetch(path, {
      credentials: 'same-origin',
      ...init,
      headers: json === undefined ? headers : { 'Content-Type': 'application/json', ...headers },
      body: json === undefined ? init.body : JSON.stringify(json),
    })
  } catch {
    throw new ApiError(0, 'network')
  }
  const text = await res.text()
  let body: unknown = null
  try {
    body = text ? JSON.parse(text) : null
  } catch {
    body = text
  }
  if (!res.ok) {
    const code =
      typeof body === 'object' && body !== null && 'error' in body ? String(body.error) : `http_${res.status}`
    if (res.status === 401 && path.startsWith('/api/admin/')) window.dispatchEvent(new Event(UNAUTHORIZED_EVENT))
    throw new ApiError(res.status, code, body)
  }
  return body as T
}
