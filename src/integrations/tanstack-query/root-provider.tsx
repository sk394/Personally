import { QueryCache, QueryClient } from '@tanstack/react-query'
import { createIsomorphicFn, createServerFn } from '@tanstack/react-start'
import { getRequest } from '@tanstack/react-start/server'
import {
  createTRPCClient,
  httpBatchLink,
  httpLink,
  isNonJsonSerializable,
  loggerLink,
  splitLink,
} from '@trpc/client'
import { createTRPCOptionsProxy } from '@trpc/tanstack-react-query'
import superjson, { SuperJSON } from 'superjson'
import type { TRPCCombinedDataTransformer } from '@trpc/server'
import type { TRPCRouter } from '@/server/router'
import { TRPCProvider } from '@/integrations/trpc/react'
import { env } from '@/lib/env.server.ts'

export const transformer: TRPCCombinedDataTransformer = {
  input: {
    serialize: (obj) => {
      if (isNonJsonSerializable(obj)) {
        return obj
      }
      return SuperJSON.serialize(obj)
    },
    deserialize: (obj) => {
      if (isNonJsonSerializable(obj)) {
        return obj
      }
      return SuperJSON.deserialize(obj)
    },
  },
  output: SuperJSON,
}

const getRequestHeaders = createServerFn({ method: 'GET' }).handler(() => {
  const request = getRequest()
  const headers = new Headers(request?.headers)

  return Object.fromEntries(headers)
})

const headers = createIsomorphicFn()
  .client(() => ({}))
  .server(() => getRequestHeaders())

function getUrl() {
  const base = (() => {
    if (typeof window !== 'undefined') {
      return ''
    }
    return `${env.SERVER_URL}`
  })()
  return `${base}/api/trpc`
}

export const trpcClient = createTRPCClient<TRPCRouter>({
  links: [
    loggerLink({
      enabled: (op) =>
        process.env.NODE_ENV === 'development' ||
        (op.direction === 'down' && op.result instanceof Error),
    }),
    splitLink({
      condition: (op) => isNonJsonSerializable(op.input),
      true: httpLink({
        url: getUrl(),
        transformer,
        fetch(url, options) {
          return fetch(url, {
            ...options,
            credentials: 'include',
          })
        },
        headers,
      }),
      false: httpBatchLink({
        url: getUrl(),
        transformer,
        headers,
        fetch(url, options) {
          return fetch(url, {
            ...options,
            credentials: 'include',
          })
        },
      }),
    }),
  ],
})

export const createQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      dehydrate: { serializeData: superjson.serialize },
      hydrate: { deserializeData: superjson.deserialize },
    },
    queryCache: new QueryCache(),
  })

export const createServerHelpers = ({
  queryClient,
}: {
  queryClient: QueryClient
}) => {
  const serverHelpers = createTRPCOptionsProxy({
    client: trpcClient,
    queryClient,
  })
  return serverHelpers
}

export function Provider({
  children,
  queryClient,
}: {
  children: React.ReactNode
  queryClient: QueryClient
}) {
  return (
    <TRPCProvider trpcClient={trpcClient} queryClient={queryClient}>
      {children}
    </TRPCProvider>
  )
}
