
import { trpcClient } from "@/integrations/tanstack-query/root-provider";
import {
    getAllLoansDef,
    getLoanDetailsDef,
    getProjectsDef,
    getSplitwiseBalancesDef,
    getSplitwiseExpensesDef,
    getSplitwiseSettlementsDef,
    getUserInfoDef,
} from "@/lib/ai/tools/definitions";
import { env } from "@/lib/env.server";

// --- User & Project Tools ---

export const getUserInfo = getUserInfoDef.server(async () => {
    const profile = await trpcClient.user.getProfile.query();
    return { user: profile.user || null };
})

export const getProjects = getProjectsDef.server(async ({ projectType, searchQuery }) => {
    let result;
    if (projectType) {
        result = await trpcClient.project.getByType.query({ projectType });
    } else {
        result = await trpcClient.project.getAll.query();
    }

    let allProjects = [...result.owned, ...result.member];

    if (searchQuery) {
        const query = searchQuery.toLowerCase();
        allProjects = allProjects.filter(p =>
            p.title.toLowerCase().includes(query) ||
            (p.description && p.description.toLowerCase().includes(query))
        );
    }

    return {
        projects: allProjects,
        createProjectLink: `${env.SERVER_URL}/dashboard/projects`
    };
})

// --- Loan Tools ---

export const getLoanData = getAllLoansDef.server(async () => {
    const loans = await trpcClient.loan.getForUser.query();
    return {
        loans: loans.map(loan => ({
            ...loan,
            contactEmail: loan.contactEmail ?? undefined,
            attachments: loan.attachments ? (loan.attachments as any[]) : undefined,
        }))
    };
})

export const getLoanDetails = getLoanDetailsDef.server(async ({ contactName }) => {
    const loans = await trpcClient.loan.getAll.query();
    const loan = loans.find(l => l.contactName.toLowerCase() === contactName.toLowerCase());
    if (!loan) {
        throw new Error(`No loan found for contact: ${contactName}`);
    }
    return {
        loan: {
            ...loan,
            contactEmail: loan.contactEmail ?? undefined,
            attachments: loan.attachments ? (loan.attachments as any[]) : undefined,
        },
        loanPageLink: `${env.SERVER_URL}/dashboard/loan/${loan.projectId}/single/${loan.id}`
    };
})

// export const createLoan = createLoanDef.server(async (input) => {
//     try {
//         const result = await trpcClient.loan.create.mutate(input);
//         return {
//             success: result.success,
//             loan: result.loan,
//             message: result.success ? 'Loan created successfully' : 'Failed to create loan'
//         };
//     } catch (error: any) {
//         return { success: false, message: error.message || 'I cannot provide information at this time.' };
//     }
// })

// export const recordLoanPayment = recordLoanPaymentDef.server(async (input) => {
//     try {
//         const result = await trpcClient.loan.addPayment.mutate(input);
//         return {
//             success: result.success,
//             payment: result.payment,
//             message: result.success ? 'Payment recorded successfully' : 'Failed to record payment'
//         };
//     } catch (error: any) {
//         return { success: false, message: error.message || 'I cannot provide information at this time.' };
//     }
// })

// --- Splitwise Tools ---

export const getSplitwiseExpenses = getSplitwiseExpensesDef.server(async ({ projectId }) => {
    const expenses = await trpcClient.splitwise.getExpenses.query({ projectId });
    return {
        expenses,
        splitwiseLink: `${env.SERVER_URL}/dashboard/splitwise/${projectId}`
    };
})

export const getSplitwiseBalances = getSplitwiseBalancesDef.server(async ({ projectId }) => {
    const balances = await trpcClient.splitwise.getBalances.query({ projectId });
    return {
        balances,
        splitwiseLink: `${env.SERVER_URL}/dashboard/splitwise/${projectId}`
    };
})

export const getSplitwiseSettlements = getSplitwiseSettlementsDef.server(async ({ projectId }) => {
    const settlements = await trpcClient.splitwise.getSettlements.query({ projectId });
    return {
        settlements,
        splitwiseLink: `${env.SERVER_URL}/dashboard/splitwise/${projectId}`
    };
})

// export const createSplitwiseExpense = createSplitwiseExpenseDef.server(async (input) => {
//     try {
//         const expense = await trpcClient.splitwise.createExpense.mutate({
//             ...input,
//             date: new Date(input.date)
//         });
//         return {
//             success: true,
//             expense,
//             message: 'Expense created successfully'
//         };
//     } catch (error: any) {
//         return { success: false, message: error.message || 'I cannot provide information at this time.' };
//     }
// })

// export const settleUpSplitwise = settleUpSplitwiseDef.server(async (input) => {
//     try {
//         await trpcClient.splitwise.settleUp.mutate({
//             ...input,
//             date: new Date(input.date)
//         });
//         return {
//             success: true,
//             message: 'Settlement recorded successfully'
//         };
//     } catch (error: any) {
//         return { success: false, message: error.message || 'I cannot provide information at this time.' };
//     }
// })