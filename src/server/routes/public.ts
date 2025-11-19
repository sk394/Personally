import { createTRPCRouter, publicProcedure } from "@/integrations/trpc/init";

export const publicRouter = createTRPCRouter({
  create: publicProcedure.query(async () => {
    return "hello world";
  }),
});
