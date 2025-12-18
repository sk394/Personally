import { createFileRoute } from '@tanstack/react-router'
import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import PersonallyLogo from '@/components/logo'
import { useTRPC } from '@/integrations/trpc/react'
import ChatInput from '@/components/chat/chat-input'
import { MessageList } from '@/components/chat/chat-messages'
import { streamChatResponse } from '@/lib/chat-actions'
import { buildMessagesForStream } from '@/lib/multimodal'

type Message = {
  id: string
  role: 'user' | 'assistant'
  content: string
  createdAt: Date
}

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
  const [messages, setMessages] = useState<Message[]>([])
  const [isStreaming, setIsStreaming] = useState(false)
  const [streamingContent, setStreamingContent] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    e.stopPropagation()

    const userContent = input.trim()
    if (!userContent || isStreaming) return

    console.log('[Dashboard] Starting message submission:', userContent)

    // Add user message
    const userMessage: Message = {
      id: crypto.randomUUID(),
      role: 'user',
      content: userContent,
      createdAt: new Date(),
    }
    setMessages((prev) => [...prev, userMessage])
    setInput("")

    setIsStreaming(true)
    setStreamingContent('')

    try {
      console.log('[Dashboard] Building messages for stream...')
      const allMessages = buildMessagesForStream(
        messages,
        userContent,
        undefined,
        false,
        'gemini'
      )
      console.log('[Dashboard] Messages built:', allMessages.length, 'messages')

      let fullContent = ''

      console.log('[Dashboard] Calling streamChatResponse...')
      const stream = await streamChatResponse({
        data: {
          messages: allMessages,
          model: 'gemini-2.5-flash',
        },
      } as any)

      console.log('[Dashboard] Stream received, starting iteration...')
      for await (const chunk of stream) {
        console.log('[Dashboard] Chunk received:', chunk)
        if (chunk.type === 'content') {
          fullContent = chunk.content
          setStreamingContent(fullContent)
        }
      }
      console.log('[Dashboard] Stream complete. Final content length:', fullContent.length)

      // Add assistant message
      const assistantMessage: Message = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: fullContent,
        createdAt: new Date(),
      }

      console.log('[Dashboard] Adding assistant message to state')
      setMessages((prev) => [...prev, assistantMessage])
      setStreamingContent('')
    } catch (error) {
      console.error('[Dashboard] Streaming error:', error)
      const errorMessage: Message = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: "Sorry, I couldn't process your request. Please try again.",
        createdAt: new Date(),
      }
      setMessages((prev) => [...prev, errorMessage])
    } finally {
      console.log('[Dashboard] Finalizing - setting isStreaming to false')
      setIsStreaming(false)
    }
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
              <div className="text-center space-y-2">
                <div className="mx-auto">
                  <PersonallyLogo width="350" height="40" />
                </div>
                <p className="text-muted-foreground text-sm">
                  How can I help you today?
                </p>
              </div>
              <ChatInput
                input={input}
                setInput={setInput}
                onSubmit={handleSubmit}
                isLoading={isStreaming}
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
                messages={messages as any}
                streamingContent={streamingContent}
                isStreaming={isStreaming}
              />
            </div>

            {/* Input */}
            <div className="p-4 border-t">
              <ChatInput
                input={input}
                setInput={setInput}
                onSubmit={handleSubmit}
                isLoading={isStreaming}
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

