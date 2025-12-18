'use client'

import { useState, useRef, useEffect } from 'react'
import { Link } from '@tanstack/react-router'
import { Send, Bot, User, Loader2, ExternalLink } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { cn } from '@/lib/utils'
import { useTRPC } from '@/integrations/trpc/react'
import { useMutation } from '@tanstack/react-query'
import type { ConversationState } from '@/server/routes/ai'

interface Message {
    id: string
    role: 'user' | 'assistant'
    content: string
    link?: string
    linkText?: string
    projects?: Array<{ id: string; title: string }>
    loans?: Array<{ id: string; contactName: string; projectId: string }>
}

export function ChatInterface() {
    const [messages, setMessages] = useState<Message[]>([
        {
            id: '1',
            role: 'assistant',
            content: "Hi! I'm your loan assistant. I can help you track loans and payments.\n\nTry saying things like:\n• \"I lent John 500 today\"\n• \"Sarah paid me 200\"\n• \"I borrowed 1000 from Mike\"\n\nWhat would you like to do?",
        },
    ])
    const [input, setInput] = useState('')
    const [conversationState, setConversationState] = useState<ConversationState>({
        pendingAction: 'none',
    })
    const [isLoading, setIsLoading] = useState(false)
    const scrollRef = useRef<HTMLDivElement>(null)
    const inputRef = useRef<HTMLInputElement>(null)

    const trpc = useTRPC()

    const chatMutation = useMutation(
        trpc.ai.chat.mutationOptions({
            onSuccess: (data) => {
                const assistantMessage: Message = {
                    id: Date.now().toString(),
                    role: 'assistant',
                    content: data.response,
                    link: data.link,
                    linkText: data.linkText,
                    projects: data.projects,
                    loans: data.loans,
                }
                setMessages((prev) => [...prev, assistantMessage])
                setConversationState(data.conversationState)
                setIsLoading(false)
            },
            onError: (error) => {
                const errorMessage: Message = {
                    id: Date.now().toString(),
                    role: 'assistant',
                    content: `Sorry, something went wrong: ${error.message}`,
                }
                setMessages((prev) => [...prev, errorMessage])
                setIsLoading(false)
            },
        }),
    )

    const selectProjectMutation = useMutation(
        trpc.ai.selectProject.mutationOptions({
            onSuccess: (data) => {
                setConversationState(data.conversationState)
                // Continue the conversation with the selected project
                chatMutation.mutate({
                    message: `Selected project ${data.conversationState.selectedProjectId}`,
                    conversationState: data.conversationState,
                })
            },
        }),
    )

    const selectLoanMutation = useMutation(
        trpc.ai.selectLoan.mutationOptions({
            onSuccess: (data) => {
                setConversationState(data.conversationState)
                // Continue the conversation with the selected loan
                chatMutation.mutate({
                    message: `Selected loan ${data.conversationState.selectedLoanId}`,
                    conversationState: data.conversationState,
                })
            },
        }),
    )

    // Auto-scroll to bottom when new messages arrive
    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight
        }
    }, [messages])

    // Focus input on mount
    useEffect(() => {
        inputRef.current?.focus()
    }, [])

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        if (!input.trim() || isLoading) return

        const userMessage: Message = {
            id: Date.now().toString(),
            role: 'user',
            content: input.trim(),
        }

        setMessages((prev) => [...prev, userMessage])
        setInput('')
        setIsLoading(true)

        chatMutation.mutate({
            message: input.trim(),
            conversationState,
        })
    }

    const handleProjectSelect = (projectId: string, projectTitle: string) => {
        const userMessage: Message = {
            id: Date.now().toString(),
            role: 'user',
            content: `I'll use "${projectTitle}"`,
        }
        setMessages((prev) => [...prev, userMessage])
        setIsLoading(true)

        selectProjectMutation.mutate({
            projectId,
            conversationState,
        })
    }

    const handleLoanSelect = (loanId: string, contactName: string) => {
        const userMessage: Message = {
            id: Date.now().toString(),
            role: 'user',
            content: `The loan with ${contactName}`,
        }
        setMessages((prev) => [...prev, userMessage])
        setIsLoading(true)

        selectLoanMutation.mutate({
            loanId,
            conversationState,
        })
    }

    return (
        <div className="flex flex-col h-[calc(100vh-4rem)] max-w-3xl mx-auto">
            {/* Chat Messages */}
            <ScrollArea className="flex-1 p-4" ref={scrollRef}>
                <div className="space-y-4">
                    {messages.map((message) => (
                        <div
                            key={message.id}
                            className={cn(
                                'flex gap-3 items-start',
                                message.role === 'user' ? 'flex-row-reverse' : 'flex-row',
                            )}
                        >
                            {/* Avatar */}
                            <div
                                className={cn(
                                    'flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center',
                                    message.role === 'user'
                                        ? 'bg-primary text-primary-foreground'
                                        : 'bg-muted',
                                )}
                            >
                                {message.role === 'user' ? (
                                    <User className="w-4 h-4" />
                                ) : (
                                    <Bot className="w-4 h-4" />
                                )}
                            </div>

                            {/* Message Bubble */}
                            <div
                                className={cn(
                                    'max-w-[80%] rounded-2xl px-4 py-2',
                                    message.role === 'user'
                                        ? 'bg-primary text-primary-foreground'
                                        : 'bg-muted',
                                )}
                            >
                                <p className="whitespace-pre-wrap text-sm">{message.content}</p>

                                {/* Action Link */}
                                {message.link && (
                                    <Link
                                        to={message.link}
                                        className="inline-flex items-center gap-1 mt-2 text-xs font-medium underline underline-offset-2 hover:opacity-80"
                                    >
                                        {message.linkText || 'View'}
                                        <ExternalLink className="w-3 h-3" />
                                    </Link>
                                )}

                                {/* Project Selection Buttons */}
                                {message.projects && message.projects.length > 0 && (
                                    <div className="mt-3 flex flex-wrap gap-2">
                                        {message.projects.map((project) => (
                                            <Button
                                                key={project.id}
                                                variant="secondary"
                                                size="sm"
                                                onClick={() => handleProjectSelect(project.id, project.title)}
                                                disabled={isLoading}
                                            >
                                                {project.title}
                                            </Button>
                                        ))}
                                    </div>
                                )}

                                {/* Loan Selection Buttons */}
                                {message.loans && message.loans.length > 0 && (
                                    <div className="mt-3 flex flex-wrap gap-2">
                                        {message.loans.map((loan) => (
                                            <Button
                                                key={loan.id}
                                                variant="secondary"
                                                size="sm"
                                                onClick={() => handleLoanSelect(loan.id, loan.contactName)}
                                                disabled={isLoading}
                                            >
                                                {loan.contactName}
                                            </Button>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}

                    {/* Loading Indicator */}
                    {isLoading && (
                        <div className="flex gap-3 items-start">
                            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                                <Bot className="w-4 h-4" />
                            </div>
                            <div className="bg-muted rounded-2xl px-4 py-2">
                                <Loader2 className="w-4 h-4 animate-spin" />
                            </div>
                        </div>
                    )}
                </div>
            </ScrollArea>

            {/* Input Area */}
            <div className="border-t p-4">
                <form onSubmit={handleSubmit} className="flex gap-2">
                    <Input
                        ref={inputRef}
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        placeholder="Type your message..."
                        disabled={isLoading}
                        className="flex-1"
                    />
                    <Button type="submit" disabled={isLoading || !input.trim()}>
                        <Send className="w-4 h-4" />
                    </Button>
                </form>
            </div>
        </div>
    )
}
