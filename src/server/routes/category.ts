import { eq } from 'drizzle-orm';
import { z } from 'zod';
import { TRPCError } from '@trpc/server';
import { db } from '@/lib/db';
import { createTRPCRouter, protectedProcedure } from '@/integrations/trpc/init';
import { category, insertCategorySchema } from '@/lib/db/schema/category';

export const categoryRouter = createTRPCRouter({
    getAll: protectedProcedure.query(async () => {
        return await db.select().from(category).orderBy(category.createdAt);
    }),

    create: protectedProcedure
        .input(insertCategorySchema)
        .mutation(async ({ input, ctx }) => {
            // protectedProcedure already ensures session exists
            const userId = ctx.session!.user.id;

            const res = await db.insert(category).values({
                ...input,
                userId,
            }).returning();

            return res;
        }),

    delete: protectedProcedure
        .input(z.object({ id: z.string().uuid() }))
        .mutation(async ({ input, ctx }) => {
            // fetch category to verify ownership / default
            const rows = await db.select().from(category).where(eq(category.id, input.id)).limit(1);
            const cat = rows[0];
            if (!cat) {
                throw new TRPCError({ code: 'NOT_FOUND', message: 'Category not found' });
            }

            // protectedProcedure already ensures session exists
            const userId = ctx.session!.user.id;
            if (cat.userId !== userId) {
                throw new TRPCError({ code: 'FORBIDDEN', message: 'You can only delete categories you created' });
            }

            await db.delete(category).where(eq(category.id, input.id));
            return { success: true };
        }),
});
