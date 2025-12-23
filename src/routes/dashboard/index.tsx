import { createFileRoute, redirect } from '@tanstack/react-router'
import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import PersonallyLogo from '@/components/logo'
import { useTRPC } from '@/integrations/trpc/react'
import ChatInput from '@/components/chat/chat-input'
import { MessageList } from '@/components/chat/chat-messages'
import { fetchServerSentEvents, UIMessage, useChat } from '@tanstack/ai-react'

export const Route = createFileRoute('/dashboard/')({
  component: RouteComponent,
  loader: async ({ context }) => {
    const session = await context.queryClient.fetchQuery(
      context.trpc.user.getSession.queryOptions(),
    )
    await context.queryClient.prefetchQuery(
      context.trpc.project.getAll.queryOptions(),
    )

    return {
      user: session?.user,
    }
  },
})

function RouteComponent() {

  const trpc = useTRPC()

  const { data: projectsData, isLoading: projectsLoading } = useQuery(
    trpc.project.getAll.queryOptions(),
  )

  if (projectsLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-full text-center space-y-4">
          <PersonallyLogo width="350" height="40" />
          <p className="text-muted-foreground">Loading your dashboard...</p>
        </div>
      </div>
    )
  }

  const [input, setInput] = useState("")
  const [selectedProject, setSelectedProject] = useState<string | null>(null)

  const { messages, sendMessage, isLoading } = useChat({
    connection: fetchServerSentEvents("/api/chat"),
    //   initialMessages: [
    //     {
    //       id: 'welcome',
    //       role: 'assistant',
    //       parts: [{
    //         type: "text", content: `Hello! I'm your AI loan assistant. I can help you with:

    // • **View Projects** - Show your loan, splitwise, or general projects
    // • **Analyze Loans** - Get details about your borrowed or lent money
    // • **Create Loans** - Add new loan entries easily
    // • **Calculate Totals** - See how much you owe or are owed
    // • **Payment History** - Review payment records

    // What would you like to do today?`,
    //       }],
    //     },
    //   ],
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    e.stopPropagation()
    sendMessage(input)
    setInput("")
  }

  // Determine if chat should be centered (no messages)
  const isCentered = messages.length === 0;

  // Prepare project options
  const allProjects = [
    ...(projectsData?.owned || []).map(p => ({ id: p.id, title: p.title })),
    ...(projectsData?.member || []).map(p => ({ id: p.id, title: p.title }))
  ];

  return (
    <div className="min-h-screen flex flex-col">
      {/* Chat Interface */}
      <div className="flex-1">
        {isCentered ? (
          // Centered view when no messages
          <div className="flex flex-col items-center justify-center h-screen px-4">
            <div className="w-full max-w-3xl space-y-6">
              <div className="text-center space-y-1">
                <div className="mx-auto sm:w-60 md:w-80 lg:w-100">
                  <PersonallyLogo width="100%" height="60px" />
                </div>
                <p className="text-muted-foreground text-sm">
                  How can I help you today?
                </p>
              </div>
              <ChatInput
                input={input}
                setInput={setInput}
                onSubmit={handleSubmit}
                isLoading={isLoading}
                projects={allProjects}
                selectedProject={selectedProject}
                onProjectChange={setSelectedProject}
              />
            </div>
          </div>
        ) : (
          // Normal view with messages
          <div className="flex flex-col h-screen">
            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4">
              <MessageList
                messages={messages as UIMessage[]}
                isStreaming={isLoading}
              />
            </div>

            {/* Input */}
            <div className="p-4 border-t">
              <ChatInput
                input={input}
                setInput={setInput}
                onSubmit={handleSubmit}
                isLoading={isLoading}
                projects={allProjects}
                selectedProject={selectedProject}
                onProjectChange={setSelectedProject}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

