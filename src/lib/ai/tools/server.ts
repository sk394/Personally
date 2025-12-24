
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
import { createCallerFactory, createTRPCContext } from "@/integrations/trpc/init";
import { trpcRouter } from "@/server/router";

// Create a caller factory for direct server-side calls
const createCaller = createCallerFactory(trpcRouter);

export async function createAuthenticatedTools(request: Request) {
    // Create tRPC context with the original request headers (includes auth cookies)
    const context = await createTRPCContext({
        headers: request.headers,
        req: request,
    });

    // Create a caller that uses this authenticated context
    const caller = createCaller(context);

    // --- User & Project Tools ---
    const getUserInfo = getUserInfoDef.server(async () => {
        const profile = await caller.user.getProfile();
        return { user: profile.user || null };
    });

    const getProjects = getProjectsDef.server(async ({ projectType, searchQuery }) => {
        let result;
        if (projectType) {
            result = await caller.project.getByType({ projectType });
        } else {
            result = await caller.project.getAll();
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
    });

    // --- Loan Tools ---
    const getLoanData = getAllLoansDef.server(async () => {
        const loans = await caller.loan.getForUser();
        return {
            loans: loans.map(loan => ({
                ...loan,
                contactEmail: loan.contactEmail ?? undefined,
                attachments: loan.attachments ? (loan.attachments as any[]) : undefined,
            }))
        };
    });

    const getLoanDetails = getLoanDetailsDef.server(async ({ contactName }) => {
        const loans = await caller.loan.getAll();
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
    });

    // --- Splitwise Tools ---
    const getSplitwiseExpenses = getSplitwiseExpensesDef.server(async ({ projectId }) => {
        const expenses = await caller.splitwise.getExpenses({ projectId });
        return {
            expenses,
            splitwiseLink: `${env.SERVER_URL}/dashboard/splitwise/${projectId}`
        };
    });

    const getSplitwiseBalances = getSplitwiseBalancesDef.server(async ({ projectId }) => {
        const balances = await caller.splitwise.getBalances({ projectId });
        return {
            balances,
            splitwiseLink: `${env.SERVER_URL}/dashboard/splitwise/${projectId}`
        };
    });

    const getSplitwiseSettlements = getSplitwiseSettlementsDef.server(async ({ projectId }) => {
        const settlements = await caller.splitwise.getSettlements({ projectId });
        return {
            settlements,
            splitwiseLink: `${env.SERVER_URL}/dashboard/splitwise/${projectId}`
        };
    });

    return {
        getUserInfo,
        getProjects,
        getLoanData,
        getLoanDetails,
        getSplitwiseExpenses,
        getSplitwiseBalances,
        getSplitwiseSettlements,
    };
}