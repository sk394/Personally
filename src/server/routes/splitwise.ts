import { z } from 'zod'
import { TRPCError } from '@trpc/server'
import { and, desc, eq, inArray, sql } from 'drizzle-orm'
import { db } from '@/lib/db'
import {
  ExpenseInsertSchema,
  SettlementInsertSchema,
  balance,
  expense,
  expenseSplit,
  settlement,
  splitwiseSetting,
} from '@/lib/db/schema/splitwise'
import { project, projectMember } from '@/lib/db/schema/project'
import { user } from '@/lib/db/schema/auth'
import { createTRPCRouter, protectedProcedure } from '@/integrations/trpc/init'

// Helper to calculate accrued interest
function calculateAccruedInterest(
  baseAmount: number, // in cents
  interestRate: number, // annual rate as decimal (e.g., 0.05 for 5%)
  startDate: Date,
  currentDate: Date = new Date(),
): number {
  // Calculate the number of days elapsed
  const daysDiff = Math.max(
    0,
    Math.floor(
      (currentDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24),
    ),
  )

  // Calculate daily interest rate
  const dailyRate = interestRate / 365

  // Calculate accrued interest: principal * rate * time
  const interest = Math.floor(baseAmount * dailyRate * daysDiff)

  return interest
}

// Helper to update balance
// Adds debt: debtor owes creditor 'amount'
async function addToBalance(
  tx: any,
  projectId: string,
  debtorId: string,
  creditorId: string,
  amount: number,
  settings?: {
    enableInterest: boolean
    interestRate?: number | null
    interestStartMonths?: number | null
  },
) {
  // Check if there is a balance entry where debtor owes creditor
  const existingBalance = await tx.query.balance.findFirst({
    where: and(
      eq(balance.projectId, projectId),
      eq(balance.fromUserId, debtorId), // Debtor
      eq(balance.toUserId, creditorId), // Creditor
    ),
  })

  if (existingBalance) {
    await tx
      .update(balance)
      .set({
        amount: existingBalance.amount + amount,
        baseAmount: existingBalance.baseAmount + amount,
      })
      .where(eq(balance.id, existingBalance.id))
  } else {
    // Check reverse balance: creditor owes debtor
    const reverseBalance = await tx.query.balance.findFirst({
      where: and(
        eq(balance.projectId, projectId),
        eq(balance.fromUserId, creditorId), // Debtor (was Creditor)
        eq(balance.toUserId, debtorId), // Creditor (was Debtor)
      ),
    })

    if (reverseBalance) {
      const newAmount = reverseBalance.amount - amount
      if (newAmount < 0) {
        // Flip direction
        await tx.delete(balance).where(eq(balance.id, reverseBalance.id))

        // Calculate interestStartDate for new balance
        let interestStartDate: Date | null = null
        if (
          settings?.enableInterest &&
          settings.interestStartMonths !== undefined &&
          settings.interestStartMonths !== null
        ) {
          interestStartDate = new Date()
          interestStartDate.setMonth(
            interestStartDate.getMonth() + settings.interestStartMonths,
          )
        }

        await tx.insert(balance).values({
          projectId: projectId,
          fromUserId: debtorId,
          toUserId: creditorId,
          amount: Math.abs(newAmount),
          baseAmount: Math.abs(newAmount),
          interestStartDate: interestStartDate,
        })
      } else if (newAmount === 0) {
        await tx.delete(balance).where(eq(balance.id, reverseBalance.id))
      } else {
        await tx
          .update(balance)
          .set({
            amount: newAmount,
            baseAmount: newAmount,
          })
          .where(eq(balance.id, reverseBalance.id))
      }
    } else {
      // Calculate interestStartDate for new balance
      let interestStartDate: Date | null = null
      if (
        settings?.enableInterest &&
        settings.interestStartMonths !== undefined &&
        settings.interestStartMonths !== null
      ) {
        interestStartDate = new Date()
        interestStartDate.setMonth(
          interestStartDate.getMonth() + settings.interestStartMonths,
        )
      }

      // Create new balance
      await tx.insert(balance).values({
        projectId: projectId,
        fromUserId: debtorId,
        toUserId: creditorId,
        amount: amount,
        baseAmount: amount,
        interestStartDate: interestStartDate,
      })
    }
  }
}

export const splitwiseRouter = createTRPCRouter({
  // Get all expenses for a project
  getExpenses: protectedProcedure
    .input(z.object({ projectId: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const userId = ctx.session!.user.id

      // Verify access
      const member = await db.query.projectMember.findFirst({
        where: and(
          eq(projectMember.projectId, input.projectId),
          eq(projectMember.userId, userId),
        ),
      })

      const projectData = await db.query.project.findFirst({
        where: eq(project.id, input.projectId),
      })

      if (!member && projectData?.userId !== userId) {
        throw new TRPCError({ code: 'FORBIDDEN', message: 'Access denied' })
      }

      const expenses = await db.query.expense.findMany({
        where: eq(expense.projectId, input.projectId),
        orderBy: desc(expense.expenseDate),
        with: {
          splits: {
            with: {
              user: true,
            },
          },
          payer: true,
        },
      })

      return expenses
    }),

  // Create a new expense
  createExpense: protectedProcedure
    .input(
      z.object({
        projectId: z.string().uuid(),
        description: z.string(),
        category: z.string(),
        amount: z.number().int().positive(), // in cents
        date: z.date(),
        paidBy: z.string(), // userId
        splitType: z.enum(['equal', 'percentage', 'shares', 'exact']),
        notes: z.string().optional(),
        receiptUrl: z.string().optional(),
        splits: z.array(
          z.object({
            userId: z.string(),
            amount: z.number().int().optional(),
            percentage: z.number().optional(),
            shares: z.number().optional(),
          }),
        ),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session!.user.id

      // Verify access
      const member = await db.query.projectMember.findFirst({
        where: and(
          eq(projectMember.projectId, input.projectId),
          eq(projectMember.userId, userId),
        ),
      })
      const projectData = await db.query.project.findFirst({
        where: eq(project.id, input.projectId),
      })

      if (!member && projectData?.userId !== userId) {
        throw new TRPCError({ code: 'FORBIDDEN', message: 'Access denied' })
      }

      // Fetch splitwise settings for interest calculation
      const settings = await db.query.splitwiseSetting.findFirst({
        where: eq(splitwiseSetting.projectId, input.projectId),
      })

      return await db.transaction(async (tx) => {
        // Create expense
        const [newExpense] = await tx
          .insert(expense)
          .values({
            projectId: input.projectId,
            description: input.description,
            amount: input.amount,
            expenseDate: input.date,
            paidBy: input.paidBy,
            splitType: input.splitType,
          })
          .returning()

        // Create splits
        // If equal split, calculate amounts
        let splitsToInsert = input.splits.map((s) => ({
          ...s,
          expenseId: newExpense.id,
          amount: s.amount || 0, // Placeholder, logic below
        }))

        if (input.splitType === 'equal') {
          const splitAmount = Math.floor(input.amount / input.splits.length)
          const remainder = input.amount % input.splits.length

          splitsToInsert = splitsToInsert.map((s, i) => ({
            ...s,
            amount: splitAmount + (i < remainder ? 1 : 0),
          }))
        }

        await tx.insert(expenseSplit).values(splitsToInsert)

        // Update balances with interest settings
        for (const split of splitsToInsert) {
          if (split.userId === input.paidBy) continue // Skip self

          // Logic: Splitter owes Payer
          await addToBalance(
            tx,
            input.projectId,
            split.userId,
            input.paidBy,
            split.amount,
            settings
              ? {
                enableInterest: settings.enableInterest,
                interestRate: settings.interestRate,
                interestStartMonths: settings.interestStartMonths,
              }
              : undefined,
          )
        }

        return newExpense
      })
    }),

  // Delete an expense
  deleteExpense: protectedProcedure
    .input(z.object({ expenseId: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session!.user.id

      // Fetch expense to check permissions and get details for balance reversal
      const expenseData = await db.query.expense.findFirst({
        where: eq(expense.id, input.expenseId),
        with: {
          splits: true,
        },
      })

      if (!expenseData) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Expense not found' })
      }

      // Verify access (must be payer or project owner/admin? For now, let's say anyone in project can delete, or just payer)
      // Let's restrict to payer or project owner for safety
      const projectData = await db.query.project.findFirst({
        where: eq(project.id, expenseData.projectId),
      })

      if (expenseData.paidBy !== userId && projectData?.userId !== userId) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message:
            'You can only delete expenses you paid for or if you are the project owner',
        })
      }

      return await db.transaction(async (tx) => {
        // Reverse balances
        for (const split of expenseData.splits) {
          if (split.userId === expenseData.paidBy) continue

          // Original: Splitter (Debtor) -> Payer (Creditor)
          // Reversal: Remove debt. Equivalent to Payer (Debtor) -> Splitter (Creditor)
          await addToBalance(
            tx,
            expenseData.projectId,
            expenseData.paidBy,
            split.userId,
            split.amount,
          )
        }

        // Delete expense (cascade deletes splits)
        await tx.delete(expense).where(eq(expense.id, input.expenseId))

        return { success: true }
      })
    }),

  // Get balances
  getBalances: protectedProcedure
    .input(z.object({ projectId: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const userId = ctx.session!.user.id
      // Verify access (omitted for brevity, same as above)

      // First, get the splitwise settings for this project
      const settings = await db.query.splitwiseSetting.findFirst({
        where: eq(splitwiseSetting.projectId, input.projectId),
      })

      const balances = await db.query.balance.findMany({
        where: eq(balance.projectId, input.projectId),
        with: {
          debtor: true,
          creditor: true,
        },
      })

      // Calculate accrued interest for each balance
      const balancesWithInterest = balances.map((bal) => {
        let accruedInterest = 0

        // Check if interest is enabled and configured
        if (
          settings?.enableInterest &&
          settings.interestRate
        ) {
          // Determine when interest should start accruing
          // If interestStartDate exists, use it. Otherwise calculate from updatedAt
          let interestStartDate = bal.interestStartDate

          if (!interestStartDate && bal.updatedAt) {
            // Calculate start date: add interestStartMonths to the balance creation/update date
            const startDate = new Date(bal.updatedAt)
            startDate.setMonth(startDate.getMonth() + (settings?.interestStartMonths || 0))
            interestStartDate = startDate
          }
          console.log("interest", interestStartDate)
          // Only calculate interest if we've passed the start date
          if (interestStartDate && new Date() >= interestStartDate) {
            accruedInterest = calculateAccruedInterest(
              bal.baseAmount,
              settings.interestRate,
              interestStartDate,
            )
          }
        }

        // Return balance with calculated interest
        return {
          ...bal,
          accruedInterest,
          totalAmount: bal.baseAmount + accruedInterest,
          interestRate: settings?.interestRate || null,
          enableInterest: settings?.enableInterest || false,
        }
      })

      return balancesWithInterest
    }),

  // Settle up
  settleUp: protectedProcedure
    .input(
      z.object({
        projectId: z.string().uuid(),
        fromUserId: z.string(),
        toUserId: z.string(),
        amount: z.number().int().positive(),
        date: z.date(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      // 1. Create settlement record
      // 2. Update balance
      return await db.transaction(async (tx) => {
        await tx.insert(settlement).values({
          projectId: input.projectId,
          fromUserId: input.fromUserId,
          toUserId: input.toUserId,
          amount: input.amount,
          principalAmount: input.amount,
          settlementDate: input.date,
          status: 'verified', // Auto-confirm for now
          createdBy: ctx.session!.user.id,
        })

        // Update balance: fromUser pays toUser
        // This reduces the debt of fromUser to toUser
        // Equivalent to adding debt of toUser to fromUser (reverse flow)
        // Wait, settleUp is a payment.
        // If A owes B $10. A pays B $10.
        // Balance A->B reduces by 10.
        // My addToBalance logic handles "adding debt".
        // "A pays B" is equivalent to "B owes A" in terms of balance shift.
        // So we call addToBalance(tx, projectId, toUser, fromUser, amount).

        await addToBalance(
          tx,
          input.projectId,
          input.toUserId,
          input.fromUserId,
          input.amount,
        )

        return { success: true }
      })
    }),

  // Get settings
  getSettings: protectedProcedure
    .input(z.object({ projectId: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const userId = ctx.session!.user.id
      // Verify access (basic check if user is member or owner)
      const projectData = await db.query.project.findFirst({
        where: eq(project.id, input.projectId),
      })
      const member = await db.query.projectMember.findFirst({
        where: and(
          eq(projectMember.projectId, input.projectId),
          eq(projectMember.userId, userId),
        ),
      })

      if (!member && projectData?.userId !== userId) {
        throw new TRPCError({ code: 'FORBIDDEN', message: 'Access denied' })
      }

      const settings = await db.query.splitwiseSetting.findFirst({
        where: eq(splitwiseSetting.projectId, input.projectId),
      })

      return settings || null
    }),

  // Update settings
  updateSettings: protectedProcedure
    .input(
      z.object({
        projectId: z.string().uuid(),
        enableInterest: z.boolean(),
        interestRate: z.number().optional(),
        interestStartMonths: z.number().optional(),
        currency: z.string().length(3),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session!.user.id

      // Verify access - only owner (or maybe admin) should change settings?
      // Let's restrict to owner for now for safety.
      const projectData = await db.query.project.findFirst({
        where: eq(project.id, input.projectId),
      })

      if (projectData?.userId !== userId) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Only the project owner can update settings',
        })
      }

      // Upsert settings
      const existing = await db.query.splitwiseSetting.findFirst({
        where: eq(splitwiseSetting.projectId, input.projectId),
      })

      if (existing) {
        return await db
          .update(splitwiseSetting)
          .set({
            enableInterest: input.enableInterest,
            interestRate: input.interestRate,
            interestStartMonths: input.interestStartMonths,
            currency: input.currency,
          })
          .where(eq(splitwiseSetting.id, existing.id))
          .returning()
      } else {
        return await db
          .insert(splitwiseSetting)
          .values({
            projectId: input.projectId,
            enableInterest: input.enableInterest,
            interestRate: input.interestRate,
            interestStartMonths: input.interestStartMonths,
            currency: input.currency,
          })
          .returning()
      }
    }),
})
