import { createTRPCContext } from '@trpc/tanstack-react-query'
import type { TRPCRouter } from '@/server/router'

// Create the tRPC context with provider and hooks
const { TRPCProvider, useTRPC } = createTRPCContext<TRPCRouter>()

export { TRPCProvider, useTRPC }
