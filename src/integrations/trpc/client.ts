// src/integrations/trpc/client.ts
import { createTRPCProxyClient, httpBatchLink } from "@trpc/client";
import type { TRPCRouter } from "@/server/router";
import superjson from "superjson";

export const api = createTRPCProxyClient<TRPCRouter>({
  links: [httpBatchLink({ url: "/api/trpc", transformer: superjson })],
});


