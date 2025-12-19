import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import type { UIMessage } from '@tanstack/ai-react';


export function MessageBubble({ message, isStreaming }: { message: UIMessage, isStreaming?: boolean }) {
    return (
        <div
            className={`flex flex-col ${message.role === "assistant" ? "items-start" : "items-end"
                }`}
        >
            <div className={`max-w-[85%] rounded-2xl px-4 py-3 ${message.role === "assistant"
                ? "bg-gray-100 text-gray-800"
                : "bg-blue-600 text-white"
                }`}>
                <div className="text-xs font-bold mb-1 opacity-50 uppercase tracking-wider">
                    {message.role === "assistant" ? "Assistant" : "You"}
                </div>
                {isStreaming ? <TypingIndicator /> : null}
                <div className="prose prose-sm max-w-none dark:prose-invert">
                    {message.parts.map((part, idx) => {
                        if (part.type === "thinking") {
                            return (
                                <div
                                    key={idx}
                                    className="text-sm text-gray-500 italic mb-2 flex items-center gap-2"
                                >
                                    <span className="animate-pulse">💭</span>
                                    <span>Thinking... {typeof part.content === 'string' ? part.content : JSON.stringify(part.content)}</span>
                                </div>
                            );
                        }
                        // if (part.type === "tool-call") {
                        //     return <div>🔄 Waiting for arguments...</div>;
                        // }
                        if (part.type === "text") {
                            return <ReactMarkdown
                                components={{
                                    h1: ({ ...props }) => <h1 className="text-2xl font-bold mt-6 mb-4" {...props} />,
                                    h2: ({ ...props }) => <h2 className="text-xl font-bold mt-5 mb-3" {...props} />,
                                    h3: ({ ...props }) => <h3 className="text-lg font-semibold mt-4 mb-2" {...props} />,
                                    p: ({ ...props }) => <p className="mb-4 leading-relaxed" {...props} />,
                                    ul: ({ ...props }) => <ul className="list-disc list-inside mb-4 space-y-1" {...props} />,
                                    ol: ({ ...props }) => <ol className="list-decimal list-inside mb-4 space-y-1" {...props} />,
                                    li: ({ ...props }) => <li className="ml-2" {...props} />,
                                    code: ({ className, children, ...props }: any) => {
                                        const isInline = !className
                                        return isInline ? (
                                            <code className="bg-muted px-1.5 py-0.5 rounded text-sm font-mono" {...props}>
                                                {children}
                                            </code>
                                        ) : (
                                            <code className="block bg-muted p-3 rounded-lg overflow-x-auto text-sm font-mono my-4" {...props}>
                                                {children}
                                            </code>
                                        )
                                    },
                                    pre: ({ ...props }) => <pre className="my-4" {...props} />,
                                    blockquote: ({ ...props }) => (
                                        <blockquote className="border-l-4 border-border pl-4 italic my-4 text-muted-foreground" {...props} />
                                    ),
                                    a: ({ ...props }) => <a href={props.href} className="text-blue-600 hover:underline">{props.children}</a>,
                                    img: ({ ...props }) => <img className="max-w-full h-auto" {...props} />
                                }}
                                key={idx}
                                remarkPlugins={[remarkGfm]}>
                                {part.content}
                            </ReactMarkdown>;
                        }
                        return null;
                    })}
                </div>
            </div>
        </div>
    );
}

export function TypingIndicator() {
    return (
        <div className="flex items-center gap-2 py-2">
            <div className="w-2 h-2 bg-muted-foreground rounded-full animate-pulse" />
        </div>
    )
}

