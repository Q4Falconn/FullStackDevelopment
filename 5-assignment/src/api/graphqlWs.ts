import { createClient, type Client } from 'graphql-ws'
import { Observable } from 'rxjs'

const GRAPHQL_WS_URL = import.meta.env.VITE_GRAPHQL_WS_URL ?? 'ws://localhost:4000/graphql'

let client: Client | null = null

function getClient(): Client {
  if (client) return client
  client = createClient({
    url: GRAPHQL_WS_URL,
    connectionParams: () => {
      const token = localStorage.getItem('auth_token')
      return token ? { Authorization: `Bearer ${token}` } : {}
    },
  })
  return client
}

export function subscribeGraphql<TData, TVars extends Record<string, any>>(
  query: string,
  variables: TVars
): Observable<TData> {
  return new Observable<TData>((subscriber) => {
    const c = getClient()
    const dispose = c.subscribe(
      { query, variables },
      {
        next: (value) => {
          const v: any = value
          if (v.errors?.length) {
            subscriber.error(new Error(v.errors.map((e: any) => e.message).join('\n')))
            return
          }
          subscriber.next(v.data as TData)
        },
        error: (err) => subscriber.error(err),
        complete: () => subscriber.complete(),
      }
    )

    return () => {
      try {
        dispose()
      } catch {
        // ignore
      }
    }
  })
}
