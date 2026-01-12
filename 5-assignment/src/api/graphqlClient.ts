const GRAPHQL_HTTP_URL = import.meta.env.VITE_GRAPHQL_HTTP_URL ?? 'http://localhost:4000/graphql'

export type GraphQLErrorLike = { message: string }

export async function graphqlRequest<TData, TVars extends Record<string, any> | undefined = undefined>(
  query: string,
  variables?: TVars
): Promise<TData> {
  const token = localStorage.getItem('auth_token')
  const res = await fetch(GRAPHQL_HTTP_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify({ query, variables }),
  })

  if (!res.ok) {
    const text = await res.text()
    throw new Error(`GraphQL HTTP error ${res.status}: ${text}`)
  }

  const json: any = await res.json()
  if (json.errors?.length) {
    throw new Error((json.errors as GraphQLErrorLike[]).map((e) => e.message).join('\n'))
  }
  return json.data as TData
}
