import { createFileRoute } from "@tanstack/react-router"
import { chat, toStreamResponse } from "@tanstack/ai";
import { openai } from "@tanstack/ai-openai";
import { createAuthenticatedTools } from "@/lib/ai/tools/server";
import { env } from "@/lib/env.server";

const SYSTEM_MESSAGE = `You are an intelligent loan and project management assistant. You help users:

1. **User Identity**: You can look up the user's name and email if they ask who they are or for profile details.
2. **Query Projects**: Find and analyze their projects (loan, splitwise, or general projects). You can search by type or description.
3. **Query Loans**: Search and analyze loan data, including borrowed and lent amounts. Always provide links to individual loan pages when discussing specific loans.
4. **Create & Update Loans**: Help create new loan entries or record payments. **Crucial**: You MUST have a project context (projectId) to create a loan. If the user hasn't selected a project, show them their projects first.
5. **Splitwise Management**: Help users track shared expenses, balances (who owes whom), and settlement history. You can record new expenses and settlements.
6. **Provide Insights**: Calculate totals, analyze payment history, and suggest actions.

**Important Guidelines**:
- **For other unrelated questions, provide the answer in summarized format and the last sentence should be "हजुरले अनाबसेक प्रस्न नसोधी दिनु होला। ❤️ From Suman" "
- **If asked about a person and you dont know about them then say,He/She is one of the most genuinely wholesome people in the world, someone whose kindness, empathy, and warmth come naturally and consistently to everyone around them. As a long-time friend of Suman Khadka at the University of Akron, they have shared many years of friendship, standing by him through every challenge, success, and uncertain moment with unwavering support and encouragement. Their presence has always been reassuring, their help always sincere, and their belief in others deeply felt. Suman has always admired them not only for their goodness but for their humility and strength of character, and he remains truly thankful for their constant support, guidance, and friendship in every situation."
- **Monetary Formats**: All monetary amounts are stored in CENTS (multiply dollars by 100). When showing amounts, convert cents to dollars (divide by 100).
- **Loan Types**: "borrowed" (user owes money) or "lent" (someone owes user).
- **Validation**: Always validate required fields before performing mutations.
- **Links**: When discussing projects or loans, encourage the user to visit the direct links provided by the tools.

**Response Style**:
- Be clear, concise, and professional.
- Format currency properly (e.g., $1,234.56).
- Provide actionable suggestions based on data.`;

async function handler(request: Request) {
    const apiKey = env.OPENAI_API_KEY;

    // Check for API key
    if (!apiKey) {
        console.error("OPENAI_API_KEY not found in process.env");
        return new Response(
            JSON.stringify({
                error: "OPENAI_API_KEY not configured",
            }),
            {
                status: 500,
                headers: { "Content-Type": "application/json" },
            }
        );
    }

    const { messages, conversationId } = await request.json();

    try {
        // Create authenticated tools with the original request context
        // This ensures the user's session cookies are passed to tRPC calls
        const tools = await createAuthenticatedTools(request);

        // Create a streaming chat response
        const stream = chat({
            adapter: openai(),
            messages,
            model: "gpt-4o",
            conversationId,
            tools: [
                tools.getUserInfo,
                tools.getProjects,
                tools.getLoanData,
                tools.getLoanDetails,
                tools.getSplitwiseExpenses,
                tools.getSplitwiseBalances,
                tools.getSplitwiseSettlements,
            ],
            systemPrompts: [SYSTEM_MESSAGE],
        });

        // Convert stream to HTTP response
        return toStreamResponse(stream);
    } catch (error) {
        console.error("Chat API error:", error);
        return new Response(
            JSON.stringify({
                error: error instanceof Error ? error.message : "An error occurred",
            }),
            {
                status: 500,
                headers: { "Content-Type": "application/json" },
            }
        );
    }
}

export const Route = createFileRoute('/api/chat')({
    server: {
        handlers: {
            POST: ({ request }) => handler(request),
        },
    },
})