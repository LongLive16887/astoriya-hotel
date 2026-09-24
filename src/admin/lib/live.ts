import { useEffect, useState } from 'react'
import { api } from '../../lib/api'
import { errorMessage } from '../components/feedback'

// One Server-Sent Events stream for the whole admin panel: the server announces what changed
// ("content:rooms", "posts", "bookings", "booking-created", "admins") and the views reload.

type Listener = (data: unknown) => void

/** Our own event: the stream came back after a break, so changes may have been missed. */
const RECONNECTED = 'reconnected'

const listeners = new Map<string, Set<Listener>>()
let source: EventSource | null = null
let attached = new Set<string>()

const dispatch = (type: string, data: unknown) => listeners.get(type)?.forEach((listener) => listener(data))

function attach(type: string) {
  if (!source || type === RECONNECTED || attached.has(type)) return
  attached.add(type)
  source.addEventListener(type, (event) => {
    let data: unknown = null
    try {
      data = JSON.parse((event as MessageEvent<string>).data)
    } catch {
      // A malformed message only means "something changed".
    }
    dispatch(type, data)
  })
}

function open() {
  if (source) return
  source = new EventSource('/api/admin/events')
  attached = new Set()
  let connected = false
  source.addEventListener('ready', () => {
    if (connected) dispatch(RECONNECTED, null)
    connected = true
  })
  for (const type of listeners.keys()) attach(type)
}

/** Calls `listener` whenever the server sends `type`; returns the function that stops it. */
export function subscribe(type: string, listener: Listener): () => void {
  if (!listeners.has(type)) listeners.set(type, new Set())
  listeners.get(type)!.add(listener)
  open()
  attach(type)
  return () => {
    listeners.get(type)?.delete(listener)
    if ([...listeners.values()].every((set) => set.size === 0)) {
      source?.close()
      source = null
    }
  }
}

export interface LiveState<T> {
  data: T | undefined
  loading: boolean
  error: string | null
}

/**
 * Loads `url` from the API and loads it again whenever one of `events` (space-separated) arrives.
 * `parse` turns the JSON into the value the view needs; it must not change between renders.
 */
export function useLiveQuery<T>(url: string | null, events: string, parse: (json: unknown) => T): LiveState<T> {
  const [state, setState] = useState<LiveState<T> & { url: string | null }>({ data: undefined, loading: true, error: null, url })

  useEffect(() => {
    if (!url) return
    let active = true
    let latest = 0
    const load = () => {
      const request = ++latest
      api(url).then(
        (json) => {
          if (active && request === latest) setState({ data: parse(json), loading: false, error: null, url })
        },
        (error: unknown) => {
          if (active && request === latest) setState((s) => ({ ...s, loading: false, error: errorMessage(error), url }))
        },
      )
    }
    load()
    const stops = [...events.split(' ').filter(Boolean), RECONNECTED].map((type) => subscribe(type, load))
    return () => {
      active = false
      stops.forEach((stop) => stop())
    }
  }, [url, events, parse])

  if (url === null) return { data: undefined, loading: false, error: null }
  // What was loaded for another address is not shown for this one.
  return state.url === url ? state : { data: undefined, loading: true, error: null }
}
