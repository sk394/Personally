import { z } from 'zod'
import { and, eq, ilike } from 'drizzle-orm'
import { TRPCError } from '@trpc/server'
import { createTRPCRouter, protectedProcedure } from '@/integrations/trpc/init'
import { db } from '@/lib/db'
import { loan, loanPayment } from '@/lib/db/schema/loan'
import { project } from '@/lib/db/schema/project'
import { user } from '@/lib/db/schema/auth'

// AI Chat message schema
const chatMessageSchema = z.object({
    role: z.enum(['user', 'assistant', 'system']),
    content: z.string(),
})

// Conversation state for multi-turn interactions
const conversationStateSchema = z.object({
    pendingAction: z.enum(['create_loan', 'add_payment', 'none']).optional(),
    selectedProjectId: z.string().uuid().optional(),
    selectedLoanId: z.string().uuid().optional(),
    partialLoanData: z.object({
        contactName: z.string().optional(),
        amount: z.number().optional(),
        type: z.enum(['borrowed', 'lent']).optional(),
        loanDate: z.string().optional(),
    }).optional(),
    partialPaymentData: z.object({
        amount: z.number().optional(),
        paymentDate: z.string().optional(),
        paymentMethod: z.enum(['cash', 'zelle']).optional(),
    }).optional(),
})

export type ConversationState = z.infer<typeof conversationStateSchema>
export type ChatMessage = z.infer<typeof chatMessageSchema>

// Helper to extract loan intent from user message
function extractLoanIntent(message: string): {
    action: 'create_loan' | 'add_payment' | 'unknown'
    contactName?: string
    amount?: number
    type?: 'borrowed' | 'lent'
} {
    const lowerMessage = message.toLowerCase()

    // Patterns for lending money
    const lentPatterns = [
        /i (?:lent|gave|loaned) (\w+) (\d+)/i,
        /(\w+) (?:borrowed|owes(?: me)?) (\d+)/i,
    ]

    // Patterns for receiving payment
    const paymentPatterns = [
        /(\w+) (?:paid|gave|returned|sent)(?: me)? (\d+)/i,
        /(?:received|got) (\d+) from (\w+)/i,
    ]

    // Patterns for borrowing money
    const borrowedPatterns = [
        /i (?:borrowed|took|got) (\d+) from (\w+)/i,
        /(\w+) (?:lent|gave) me (\d+)/i,
    ]

    // Check for lending
    for (const pattern of lentPatterns) {
        const match = message.match(pattern)
        if (match) {
            return {
                action: 'create_loan',
                contactName: match[1],
                amount: parseInt(match[2]) * 100, // Convert to cents
                type: 'lent',
            }
        }
    }

    // Check for payment received
    for (const pattern of paymentPatterns) {
        const match = message.match(pattern)
        if (match) {
            // Handle both patterns (name first or amount first)
            const isNameFirst = isNaN(parseInt(match[1]))
            return {
                action: 'add_payment',
                contactName: isNameFirst ? match[1] : match[2],
                amount: parseInt(isNameFirst ? match[2] : match[1]) * 100,
            }
        }
    }

    // Check for borrowing
    for (const pattern of borrowedPatterns) {
        const match = message.match(pattern)
        if (match) {
            const isAmountFirst = !isNaN(parseInt(match[1]))
            return {
                action: 'create_loan',
                contactName: isAmountFirst ? match[2] : match[1],
                amount: parseInt(isAmountFirst ? match[1] : match[2]) * 100,
                type: 'borrowed',
            }
        }
    }

    return { action: 'unknown' }
}

export const aiRouter = createTRPCRouter({
    // Process a chat message and return AI response
    chat: protectedProcedure
        .input(z.object({
            message: z.string(),
            conversationState: conversationStateSchema.optional(),
        }))
        .mutation(async ({ ctx, input }) => {
            const userId = ctx.session!.user.id
            const state = input.conversationState || { pendingAction: 'none' }

            // Get user info
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

            const userName = userData[0].name || 'User'

            // Get user's loan projects
            const loanProjects = await db
                .select()
                .from(project)
                .where(and(
                    eq(project.userId, userId),
                    eq(project.projectType, 'loan')
                ))

            // If we're waiting for project selection
            if (state.pendingAction === 'create_loan' && state.partialLoanData && !state.selectedProjectId) {
                // Try to find project by name from user message
                const projectMatch = loanProjects.find(p =>
                    input.message.toLowerCase().includes(p.title.toLowerCase()) ||
                    input.message.includes(p.id)
                )

                if (projectMatch) {
                    state.selectedProjectId = projectMatch.id
                } else if (loanProjects.length === 1) {
                    state.selectedProjectId = loanProjects[0].id
                }
            }

            // Extract intent from message
            const intent = extractLoanIntent(input.message)

            // Handle create loan flow
            if (intent.action === 'create_loan' || state.pendingAction === 'create_loan') {
                const loanData = {
                    ...state.partialLoanData,
                    contactName: intent.contactName || state.partialLoanData?.contactName,
                    amount: intent.amount || state.partialLoanData?.amount,
                    type: intent.type || state.partialLoanData?.type,
                    loanDate: new Date().toISOString(),
                }

                // Check if we have all required data
                if (!loanData.contactName) {
                    return {
                        response: "Who did you lend money to or borrow from?",
                        conversationState: {
                            pendingAction: 'create_loan' as const,
                            partialLoanData: loanData,
                        },
                    }
                }

                if (!loanData.amount) {
                    return {
                        response: `How much did you ${loanData.type === 'borrowed' ? 'borrow from' : 'lend to'} ${loanData.contactName}?`,
                        conversationState: {
                            pendingAction: 'create_loan' as const,
                            partialLoanData: loanData,
                        },
                    }
                }

                if (!loanData.type) {
                    return {
                        response: `Did you lend money to ${loanData.contactName} or borrow from them?`,
                        conversationState: {
                            pendingAction: 'create_loan' as const,
                            partialLoanData: loanData,
                        },
                    }
                }

                // Check for loan projects
                if (loanProjects.length === 0) {
                    return {
                        response: "You don't have any loan projects yet. Please create a loan project first by going to your projects page, then come back here to track your loan.",
                        conversationState: { pendingAction: 'none' as const },
                        link: '/dashboard/projects',
                    }
                }

                // If multiple projects and none selected, ask for selection
                if (loanProjects.length > 1 && !state.selectedProjectId) {
                    const projectList = loanProjects.map(p => `- ${p.title}`).join('\n')
                    return {
                        response: `I found multiple loan projects. Which one should I add this loan to?\n\n${projectList}`,
                        conversationState: {
                            pendingAction: 'create_loan' as const,
                            partialLoanData: loanData,
                        },
                        projects: loanProjects.map(p => ({ id: p.id, title: p.title })),
                    }
                }

                // Use selected project or the only one available
                const projectId = state.selectedProjectId || loanProjects[0].id

                // Create the loan
                try {
                    const [newLoan] = await db
                        .insert(loan)
                        .values({
                            userId,
                            projectId,
                            type: loanData.type!,
                            contactName: loanData.contactName!,
                            principalAmount: loanData.amount!,
                            currency: 'USD',
                            hasInterest: false,
                            loanDate: new Date(),
                            status: 'active',
                            totalPaid: 0,
                        })
                        .returning()

                    const formattedAmount = (loanData.amount! / 100).toLocaleString('en-US', {
                        style: 'currency',
                        currency: 'USD',
                    })

                    const projectTitle = loanProjects.find(p => p.id === projectId)?.title || 'your project'

                    return {
                        response: `✅ Done! I've recorded that you ${loanData.type === 'lent' ? 'lent' : 'borrowed'} ${formattedAmount} ${loanData.type === 'lent' ? 'to' : 'from'} ${loanData.contactName} in "${projectTitle}".`,
                        conversationState: { pendingAction: 'none' as const },
                        link: `/dashboard/loan/${projectId}/single/${newLoan.id}`,
                        linkText: 'View Loan',
                    }
                } catch (error) {
                    console.error('Error creating loan:', error)
                    return {
                        response: "Sorry, I couldn't create the loan. Please try again.",
                        conversationState: { pendingAction: 'none' as const },
                    }
                }
            }

            // Handle add payment flow
            if (intent.action === 'add_payment' || state.pendingAction === 'add_payment') {
                const paymentData = {
                    ...state.partialPaymentData,
                    amount: intent.amount || state.partialPaymentData?.amount,
                    paymentDate: new Date().toISOString(),
                    paymentMethod: 'zelle' as const,
                }

                const contactName = intent.contactName || state.partialLoanData?.contactName

                if (!contactName) {
                    return {
                        response: "Who made this payment?",
                        conversationState: {
                            pendingAction: 'add_payment' as const,
                            partialPaymentData: paymentData,
                        },
                    }
                }

                if (!paymentData.amount) {
                    return {
                        response: `How much did ${contactName} pay?`,
                        conversationState: {
                            pendingAction: 'add_payment' as const,
                            partialPaymentData: paymentData,
                            partialLoanData: { contactName },
                        },
                    }
                }

                // Find matching loans by contact name
                const matchingLoans = await db
                    .select({
                        loan: loan,
                        project: project,
                    })
                    .from(loan)
                    .innerJoin(project, eq(loan.projectId, project.id))
                    .where(and(
                        eq(loan.userId, userId),
                        ilike(loan.contactName, `%${contactName}%`),
                        eq(loan.status, 'active')
                    ))

                if (matchingLoans.length === 0) {
                    // Try partial match
                    const allLoans = await db
                        .select({
                            loan: loan,
                            project: project,
                        })
                        .from(loan)
                        .innerJoin(project, eq(loan.projectId, project.id))
                        .where(and(
                            eq(loan.userId, userId),
                            eq(loan.status, 'active')
                        ))

                    if (allLoans.length === 0) {
                        return {
                            response: `I couldn't find any active loans with "${contactName}". Do you want to create a new loan instead?`,
                            conversationState: { pendingAction: 'none' as const },
                        }
                    }

                    const loanList = allLoans.map(l =>
                        `- ${l.loan.contactName} (${l.loan.type === 'lent' ? 'owes you' : 'you owe'} $${(l.loan.principalAmount - l.loan.totalPaid) / 100})`
                    ).join('\n')

                    return {
                        response: `I couldn't find a loan with "${contactName}". Here are your active loans:\n\n${loanList}\n\nWho made the payment?`,
                        conversationState: {
                            pendingAction: 'add_payment' as const,
                            partialPaymentData: paymentData,
                        },
                        loans: allLoans.map(l => ({
                            id: l.loan.id,
                            contactName: l.loan.contactName,
                            projectId: l.project.id,
                        })),
                    }
                }

                // If multiple loans match, ask for selection
                if (matchingLoans.length > 1 && !state.selectedLoanId) {
                    const loanList = matchingLoans.map(l =>
                        `- ${l.loan.contactName} in "${l.project.title}" (${l.loan.type === 'lent' ? 'owes you' : 'you owe'} $${(l.loan.principalAmount - l.loan.totalPaid) / 100})`
                    ).join('\n')

                    return {
                        response: `I found multiple loans for "${contactName}". Which one?\n\n${loanList}`,
                        conversationState: {
                            pendingAction: 'add_payment' as const,
                            partialPaymentData: paymentData,
                            partialLoanData: { contactName },
                        },
                        loans: matchingLoans.map(l => ({
                            id: l.loan.id,
                            contactName: l.loan.contactName,
                            projectId: l.project.id,
                        })),
                    }
                }

                const targetLoan = state.selectedLoanId
                    ? matchingLoans.find(l => l.loan.id === state.selectedLoanId) || matchingLoans[0]
                    : matchingLoans[0]

                // Determine if this is a repayment (opposite direction) or additional lending
                const loanType = targetLoan.loan.type
                // Payment is from contact, so it's a repayment if loan type is 'lent'
                const isRepayment = loanType === 'lent'

                // Add payment
                try {
                    const [newPayment] = await db
                        .insert(loanPayment)
                        .values({
                            loanId: targetLoan.loan.id,
                            amount: paymentData.amount!,
                            paymentDate: new Date(),
                            principalPaid: paymentData.amount!,
                            interestPaid: 0,
                            paymentMethod: 'zelle',
                            createdBy: contactName,
                        })
                        .returning()

                    // Update loan totals
                    const newTotalPaid = isRepayment
                        ? targetLoan.loan.totalPaid + paymentData.amount!
                        : targetLoan.loan.totalPaid
                    const newPrincipal = isRepayment
                        ? targetLoan.loan.principalAmount
                        : targetLoan.loan.principalAmount + paymentData.amount!

                    await db
                        .update(loan)
                        .set({
                            totalPaid: newTotalPaid,
                            principalAmount: newPrincipal,
                            status: newTotalPaid >= newPrincipal ? 'paid' :
                                newTotalPaid > 0 ? 'partially_paid' : 'active',
                            updatedAt: new Date(),
                        })
                        .where(eq(loan.id, targetLoan.loan.id))

                    const formattedAmount = (paymentData.amount! / 100).toLocaleString('en-US', {
                        style: 'currency',
                        currency: 'USD',
                    })

                    const remaining = Math.max(0, newPrincipal - newTotalPaid)
                    const formattedRemaining = (remaining / 100).toLocaleString('en-US', {
                        style: 'currency',
                        currency: 'USD',
                    })

                    const statusMessage = remaining === 0
                        ? `The loan is now fully paid! 🎉`
                        : `Remaining balance: ${formattedRemaining}`

                    return {
                        response: `✅ Recorded! ${targetLoan.loan.contactName} paid ${formattedAmount}. ${statusMessage}`,
                        conversationState: { pendingAction: 'none' as const },
                        link: `/dashboard/loan/${targetLoan.project.id}/single/${targetLoan.loan.id}`,
                        linkText: 'View Loan',
                    }
                } catch (error) {
                    console.error('Error adding payment:', error)
                    return {
                        response: "Sorry, I couldn't record the payment. Please try again.",
                        conversationState: { pendingAction: 'none' as const },
                    }
                }
            }

            // Note: Project/loan ID selection is handled within the create_loan and add_payment
            // flows above (see lines 145-156 for project matching logic)

            // Default response for unrecognized messages
            return {
                response: `Hi ${userName}! I can help you track loans. Try saying things like:\n\n• "I lent John 500 today"\n• "Sarah paid me 200"\n• "I borrowed 1000 from Mike"\n\nWhat would you like to do?`,
                conversationState: { pendingAction: 'none' as const },
            }
        }),

    // Select a project for loan creation
    selectProject: protectedProcedure
        .input(z.object({
            projectId: z.string().uuid(),
            conversationState: conversationStateSchema,
        }))
        .mutation(async ({ input }) => {
            return {
                conversationState: {
                    ...input.conversationState,
                    selectedProjectId: input.projectId,
                },
            }
        }),

    // Select a loan for payment
    selectLoan: protectedProcedure
        .input(z.object({
            loanId: z.string().uuid(),
            conversationState: conversationStateSchema,
        }))
        .mutation(async ({ input }) => {
            return {
                conversationState: {
                    ...input.conversationState,
                    selectedLoanId: input.loanId,
                },
            }
        }),
})
