// src/integrations/trpc/client.ts
import { createTRPCProxyClient, httpBatchLink } from '@trpc/client'
import superjson from 'superjson'
import type { TRPCRouter } from '@/server/router'

export const api = createTRPCProxyClient<TRPCRouter>({
  links: [httpBatchLink({ url: '/api/trpc', transformer: superjson })],
})
