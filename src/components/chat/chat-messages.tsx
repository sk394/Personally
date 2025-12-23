import { Bot } from 'lucide-react'
import { MessageBubble } from './chat-message-helper'
import type { UIMessage } from '@tanstack/ai-react'


interface EmptyChatStateProps {
    onToggleSidebar?: () => void
}

export function EmptyChatState({ }: EmptyChatStateProps) {
    return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
            <div className="w-16 h-16 rounded-3xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center mb-6 shadow-lg">
                <Bot className="w-8 h-8 text-primary" />
            </div>
            <h2 className="text-2xl font-semibold mb-3">How can I help?</h2>
            <p className="text-muted-foreground text-sm max-w-sm">
                Start a conversation below.
            </p>
        </div>
    )
}

interface MessageListProps {
    messages: UIMessage[]
    isStreaming: boolean
}

export function MessageList({
    messages,
    isStreaming,
}: MessageListProps) {
    return (
        <div className="space-y-6 pb-4">
            {messages.map((message) => (
                <MessageBubble key={message.id} message={message} isStreaming={isStreaming} />
            ))}
        </div>
    )
}