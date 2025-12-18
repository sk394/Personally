import { LoanPaymentSelectSchema, LoanSelectSchema, InsertLoanPaymentSchema, insertLoanSchema } from "@/lib/db/schema/loan";
import { selectProjectSchema } from "@/lib/db/schema/project";
import { toolDefinition } from "@tanstack/ai";
import z from "zod";

export const getUserInfoDef = toolDefinition({
    name: 'get_user_info',
    description: 'Get details about the currently authenticated user, including their name and email.',
    inputSchema: z.object({}),
    outputSchema: z.object({
        user: z.object({
            id: z.string(),
            name: z.string().nullable(),
            email: z.string(),
        }).nullable()
    })
})

export const getProjectsDef = toolDefinition({
    name: 'get_user_projects',
    description: 'List projects the user is involved in. Can filter by project type (loan, splitwise, general) or search by description.',
    inputSchema: z.object({
        projectType: z.enum(['loan', 'splitwise', 'general']).optional(),
        searchQuery: z.string().optional().describe('Search term for project title or description'),
    }),
    outputSchema: z.object({
        projects: z.array(selectProjectSchema),
        createProjectLink: z.string().describe('Link to create a new project if the user wants to start something new')
    })
})

// --- Loan Tools ---

export const getAllLoansDef = toolDefinition({
    name: 'get_all_loans',
    description: 'Get a summary list of all loans (both borrowed and lent) for the user.',
    inputSchema: z.object({}),
    outputSchema: z.object({
        loans: z.array(LoanSelectSchema.extend({
            attachments: z.array(z.any()).optional(),
            contactEmail: z.string().optional(),
        })),
    })
})

export const getLoanDetailsDef = toolDefinition({
    name: 'get_loan_details',
    description: 'Get detailed information about a specific loan, including its full payment history and a direct link to the loan page.',
    inputSchema: z.object({
        contactName: z.string().describe('Name of the loanee or lender to identify the loan'),
    }),
    outputSchema: z.object({
        loan: LoanSelectSchema.extend({
            payments: z.array(LoanPaymentSelectSchema),
            contactEmail: z.string().optional(),
            attachments: z.array(z.any()).optional(),
        }),
        loanPageLink: z.string().describe('URL to the individual loan page')
    })
})

export const createLoanDef = toolDefinition({
    name: 'create_loan',
    description: 'Create a new loan record. Requires a project to be selected first. If the user hasn\'t selected a project, ask them to pick one from the dropdown in the chat window. (requires approval)',
    inputSchema: z.object({

    }),
    outputSchema: z.object({
        success: z.boolean(),
        loanPageLink: z.string().describe('URL to the newly created loan page').optional(),
        message: z.string().optional()
    }),
    needsApproval: true
})

export const recordLoanPaymentDef = toolDefinition({
    name: 'record_loan_payment',
    description: 'Record a new payment toward a specific loan. The specific loan project must be selected. The user should be asked to provide the project id.',
    inputSchema: InsertLoanPaymentSchema,
    outputSchema: z.object({
        success: z.boolean(),
        payment: LoanPaymentSelectSchema.optional(),
        message: z.string().optional()
    })
})

// --- Splitwise Tools ---

export const getSplitwiseExpensesDef = toolDefinition({
    name: 'get_splitwise_expenses',
    description: 'Get all expenses recorded for a specific splitwise project.',
    inputSchema: z.object({
        projectId: z.string().uuid().describe("ID of the splitwise project to query"),
    }),
    outputSchema: z.object({
        expenses: z.array(z.any()), // Complex nested structure from TRPC
        splitwiseLink: z.string().describe('Link to the splitwise project page')
    })
})

export const getSplitwiseBalancesDef = toolDefinition({
    name: 'get_splitwise_balances',
    description: 'Check the current balances and debts within a splitwise project. Shows who owes how much.',
    inputSchema: z.object({
        projectId: z.string().uuid()
    }),
    outputSchema: z.object({
        balances: z.array(z.any()), // Includes computed interest
        splitwiseLink: z.string().describe('Link to the splitwise project page')
    })
})

export const getSplitwiseSettlementsDef = toolDefinition({
    name: 'get_splitwise_settlements',
    description: 'Get the history of settlements (payments) between members in a splitwise project.',
    inputSchema: z.object({
        projectId: z.string().uuid()
    }),
    outputSchema: z.object({
        settlements: z.array(z.any()),
        splitwiseLink: z.string().describe('Link to the splitwise project page')
    })
})

export const createSplitwiseExpenseDef = toolDefinition({
    name: 'create_splitwise_expense',
    description: 'Record a new shared expense in a splitwise project. Requires a project ID and split details.',
    inputSchema: z.object({
        projectId: z.string().uuid(),
        description: z.string(),
        category: z.string(),
        amount: z.number().int().positive().describe('Amount in cents'),
        date: z.string().describe('ISO date string'),
        paidBy: z.string().describe('User ID of the person who paid'),
        splitType: z.enum(['equal', 'percentage', 'shares', 'exact']),
        notes: z.string().optional(),
        splits: z.array(z.object({
            userId: z.string(),
            amount: z.number().int().optional(),
            percentage: z.number().optional(),
            shares: z.number().optional(),
        }))
    }),
    outputSchema: z.object({
        success: z.boolean(),
        expense: z.any().optional(),
        message: z.string().optional()
    })
})

export const settleUpSplitwiseDef = toolDefinition({
    name: 'settle_up_splitwise',
    description: 'Record a payment between two users in a splitwise project to settle debts.',
    inputSchema: z.object({
        projectId: z.string().uuid(),
        fromUserId: z.string(),
        toUserId: z.string(),
        amount: z.number().int().positive().describe('Amount in cents'),
        paymentMethod: z.enum(['zelle', 'cash']),
        date: z.string().describe('ISO date string')
    }),
    outputSchema: z.object({
        success: z.boolean(),
        message: z.string().optional()
    })
})