import { and, desc, eq, inArray } from 'drizzle-orm'
import { z } from 'zod'
import { TRPCError } from '@trpc/server'
import { db } from '@/lib/db'
import {
  InsertLoanPaymentSchema,
  insertLoanSchema,
  loan,
  loanPayment,
} from '@/lib/db/schema/loan'
import { project } from '@/lib/db/schema/project'
import { user } from '@/lib/db/schema/auth'
import { createTRPCRouter, protectedProcedure } from '@/integrations/trpc/init'

export const loanRouter = createTRPCRouter({
  // get only loans for the current user
  getForUser: protectedProcedure.query(async ({ ctx }) => {
    const userId = ctx.session!.user.id
    const loans = await db
      .select()
      .from(loan)
      .where(eq(loan.userId, userId))
      .orderBy(desc(loan.createdAt))

    if (!loans.length) {
      return []
    }
    return loans
  }),

  // Get all loans
  getAll: protectedProcedure.query(async ({ ctx }) => {
    const userId = ctx.session!.user.id
    // get all loans for user
    const loans = await db
      .select()
      .from(loan)
      .where(eq(loan.userId, userId))
      .orderBy(desc(loan.createdAt))

    if (!loans.length) {
      return []
    }

    const loanIds = loans.map((l) => l.id)

    // Get payments for these loans
    const payments = await db
      .select()
      .from(loanPayment)
      .where(inArray(loanPayment.loanId, loanIds))
      .orderBy(desc(loanPayment.paymentDate))

    // Attach payments to loans
    return loans.map((l) => ({
      ...l,
      payments: payments.filter((p) => p.loanId === l.id),
    }))
  }),

  // Get a single loan by ID
  getById: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const userId = ctx.session!.user.id

      const loanData = await db
        .select()
        .from(loan)
        .where(eq(loan.id, input.id))
        .limit(1)

      if (!loanData.length) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Loan not found',
        })
      }

      // Verify user has access to this loan
      if (loanData[0].userId !== userId) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'You do not have access to this loan',
        })
      }

      // Get loan payments
      const payments = await db
        .select()
        .from(loanPayment)
        .where(eq(loanPayment.loanId, input.id))
        .orderBy(desc(loanPayment.paymentDate))

      return {
        ...loanData[0],
        payments,
      }
    }),

  // Create a new loan
  create: protectedProcedure
    .input(insertLoanSchema.omit({ userId: true }))
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session!.user.id

      // Ensure the project exists and user has access
      const projectData = await db
        .select()
        .from(project)
        .where(eq(project.id, input.projectId))
        .limit(1)

      if (!projectData.length) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Project not found',
        })
      }

      // Check if a loan with the same contact email already exists in this project
      if (input.contactEmail) {
        const existingLoan = await db
          .select()
          .from(loan)
          .where(
            and(
              eq(loan.projectId, input.projectId),
              eq(loan.contactEmail, input.contactEmail),
            ),
          )
          .limit(1)

        if (existingLoan.length > 0) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: `A loan with contact email "${input.contactEmail}" already exists in this project`,
          })
        }
      }

      const [newLoan] = await db
        .insert(loan)
        .values({
          ...input,
          userId,
        })
        .returning()

      return {
        success: true,
        loan: newLoan,
      }
    }),

  // Update a loan
  update: protectedProcedure
    .input(
      z.object({
        id: z.string().uuid(),
        contactName: z.string().optional(),
        contactEmail: z.string().email().optional(),
        principalAmount: z.number().int().positive().optional(),
        currency: z.string().length(3).optional(),
        hasInterest: z.boolean().optional(),
        interestRate: z.number().optional(),
        loanDate: z.date().optional(),
        dueDate: z.date().optional(),
        status: z
          .enum(['active', 'paid', 'overdue', 'partially_paid'])
          .optional(),
        notes: z.string().optional(),
        attachments: z.any().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session!.user.id
      const { id, ...updateData } = input

      // Verify ownership
      const loanData = await db
        .select()
        .from(loan)
        .where(eq(loan.id, id))
        .limit(1)

      if (!loanData.length) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Loan not found',
        })
      }

      if (loanData[0].userId !== userId) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'You do not have permission to update this loan',
        })
      }

      await db
        .update(loan)
        .set({
          ...updateData,
          updatedAt: new Date(),
        })
        .where(eq(loan.id, id))

      return { success: true }
    }),

  // Delete a loan
  delete: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session!.user.id

      const loanData = await db
        .select()
        .from(loan)
        .where(eq(loan.id, input.id))
        .limit(1)

      if (!loanData.length) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Loan not found',
        })
      }

      if (loanData[0].userId !== userId) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'You do not have permission to delete this loan',
        })
      }

      await db.delete(loan).where(eq(loan.id, input.id))

      return { success: true }
    }),

  // Add a payment to a loan
  addPayment: protectedProcedure
    .input(InsertLoanPaymentSchema)
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session!.user.id

      // Get user information
      const userData = await db
        .select()
        .from(user)
        .where(eq(user.id, userId))
        .limit(1)

      if (!userData.length) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'User not found',
        })
      }

      const userName = userData[0].name

      // Verify loan ownership
      const loanData = await db
        .select()
        .from(loan)
        .where(eq(loan.id, input.loanId))
        .limit(1)

      if (!loanData.length) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Loan not found',
        })
      }

      if (loanData[0].userId !== userId) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'You do not have access to this loan',
        })
      }

      // Determine if payment is in the same direction as the loan or opposite
      // createdBy is the name of who made the payment (either userName or contactName)
      const isPaymentByOwner = input.createdBy === userName
      const loanType = loanData[0].type

      /**
       * Payment direction logic:
       * - If loan type is "lent" (user lent to contact):
       *   - Owner pays → Additional lending (INCREASE principal)
       *   - Contact pays → Repayment (DECREASE debt, current behavior)
       * - If loan type is "borrowed" (user borrowed from contact):
       *   - Owner pays → Repayment (DECREASE debt, current behavior)
       *   - Contact pays → Additional borrowing (INCREASE principal)
       */
      const isSameDirectionAsLoan =
        (loanType === 'lent' && isPaymentByOwner) ||
        (loanType === 'borrowed' && !isPaymentByOwner)

      // Create the payment
      const [newPayment] = await db
        .insert(loanPayment)
        .values(input)
        .returning()

      let newTotalPaid: number
      let newPrincipalAmount: number

      if (isSameDirectionAsLoan) {
        // Payment in same direction as loan - increase principal
        newPrincipalAmount = loanData[0].principalAmount + input.amount
        // TotalPaid doesn't change since this is additional lending/borrowing
        newTotalPaid = loanData[0].totalPaid
      } else {
        // Payment in opposite direction - this is a repayment
        newTotalPaid = loanData[0].totalPaid + input.amount
        // Principal doesn't change
        newPrincipalAmount = loanData[0].principalAmount
      }

      await db
        .update(loan)
        .set({
          totalPaid: newTotalPaid,
          principalAmount: newPrincipalAmount,
          status:
            newTotalPaid >= newPrincipalAmount
              ? 'paid'
              : newTotalPaid > 0
                ? 'partially_paid'
                : loanData[0].status,
          updatedAt: new Date(),
        })
        .where(eq(loan.id, input.loanId))

      return {
        success: true,
        payment: newPayment,
      }
    }),

  // Get payments for a loan
  getPayments: protectedProcedure
    .input(z.object({ loanId: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const userId = ctx.session!.user.id

      // Verify loan ownership
      const loanData = await db
        .select()
        .from(loan)
        .where(eq(loan.id, input.loanId))
        .limit(1)

      if (!loanData.length) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Loan not found',
        })
      }

      if (loanData[0].userId !== userId) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'You do not have access to this loan',
        })
      }

      return await db
        .select()
        .from(loanPayment)
        .where(eq(loanPayment.loanId, input.loanId))
        .orderBy(desc(loanPayment.paymentDate))
    }),

  // Get loan statistics by project
  getStatsByProject: protectedProcedure
    .input(z.object({ projectId: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const userId = ctx.session!.user.id

      // Verify user has access to this project
      const projectData = await db
        .select()
        .from(project)
        .where(eq(project.id, input.projectId))
        .limit(1)

      if (!projectData.length) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Project not found',
        })
      }

      if (projectData[0].userId !== userId) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'You do not have access to this project',
        })
      }

      // Get all loans for this project
      const loans = await db
        .select()
        .from(loan)
        .where(eq(loan.projectId, input.projectId))

      const stats = {
        totalBorrowed: 0,
        totalLent: 0,
        totalBorrowedPaid: 0,
        totalLentPaid: 0,
        activeBorrowed: 0,
        activeLent: 0,
      }

      loans.forEach((l) => {
        if (l.type === 'borrowed') {
          stats.totalBorrowed += l.principalAmount
          stats.totalBorrowedPaid += l.totalPaid
          if (
            l.status === 'active' ||
            l.status === 'overdue' ||
            l.status === 'partially_paid'
          ) {
            stats.activeBorrowed++
          }
        } else {
          stats.totalLent += l.principalAmount
          stats.totalLentPaid += l.totalPaid
          if (
            l.status === 'active' ||
            l.status === 'overdue' ||
            l.status === 'partially_paid'
          ) {
            stats.activeLent++
          }
        }
      })

      return stats
    }),
})
