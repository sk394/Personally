import { Bot } from 'lucide-react'
import { MessageBubble } from './chat-message-helper'
import type { UIMessage } from '@tanstack/ai-react'


interface EmptyChatStateProps {
    onToggleSidebar?: () => void
}

export function EmptyChatState({ }: EmptyChatStateProps) {
    return (
        <div className="flex flex-col items-center justify-center min-h-[50vh] sm:min-h-[60vh] text-center px-4">
            <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-2xl sm:rounded-3xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center mb-4 sm:mb-6 shadow-lg">
                <Bot className="w-6 h-6 sm:w-8 sm:h-8 text-primary" />
            </div>
            <h2 className="text-lg sm:text-2xl font-semibold mb-2 sm:mb-3">How can I help?</h2>
            <p className="text-muted-foreground text-xs sm:text-sm max-w-sm">
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
        <div className="space-y-3 sm:space-y-6 pb-2 sm:pb-4">
            {messages.map((message) => (
                <MessageBubble key={message.id} message={message} isStreaming={isStreaming} />
            ))}
        </div>
    )
}