import { createTRPCRouter, protectedProcedure, publicProcedure } from '@/integrations/trpc/init'

export const userRouter = createTRPCRouter({
  getSession: publicProcedure.query(async ({ ctx }) => {
    return ctx.session
  }),
  getProfile: protectedProcedure.query(async ({ ctx }) => {
    return {
      user: ctx.session?.user,
      session: {
        id: ctx.session?.session?.id,
        expiresAt: ctx.session?.session?.expiresAt,
        token: ctx.session?.session?.token,
        ipAddress: ctx.session?.session?.ipAddress,
        userAgent: ctx.session?.session?.userAgent,
        createdAt: ctx.session?.session?.createdAt,
        updatedAt: ctx.session?.session?.updatedAt,
        userId: ctx.session?.session?.userId,
      },
    }
  }),
})
