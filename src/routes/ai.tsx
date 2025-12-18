import { createFileRoute } from '@tanstack/react-router'
import { useState } from "react";
import { useChat, fetchServerSentEvents } from "@tanstack/ai-react";
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

export const Route = createFileRoute('/ai')({
  component: Chat,
})


export function Chat() {
  const [input, setInput] = useState("");

  const { messages, sendMessage, isLoading } = useChat({
    connection: fetchServerSentEvents("/api/chat"),
    initialMessages: [
      {
        id: 'welcome',
        role: 'assistant',
        parts: [{
          type: "text", content: `Hello! I'm your AI loan assistant. I can help you with:

• **View Projects** - Show your loan, splitwise, or general projects
• **Analyze Loans** - Get details about your borrowed or lent money
• **Create Loans** - Add new loan entries easily
• **Calculate Totals** - See how much you owe or are owed
• **Payment History** - Review payment records

What would you like to do today?`,
        }],
      },
    ],
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim() && !isLoading) {
      sendMessage(input);
      setInput("");
    }
  };

  return (
    <div className="flex flex-col h-screen max-w-3xl mx-auto border-x bg-white">
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {messages.map((message) => (
          <div
            key={message.id}
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
                  if (part.type === "text") {
                    return <ReactMarkdown key={idx} remarkPlugins={[remarkGfm]}>{part.content}</ReactMarkdown>;
                  }
                  return null;
                })}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Input */}
      <form onSubmit={handleSubmit} className="p-4 border-t bg-gray-50">
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type a message..."
            className="flex-1 px-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all"
            disabled={isLoading}
          />
          <button
            type="submit"
            disabled={!input.trim() || isLoading}
            className="px-6 py-3 bg-blue-600 text-white rounded-xl disabled:opacity-50 hover:bg-blue-700 transition-colors font-medium shadow-sm"
          >
            Send
          </button>
        </div>
      </form>
    </div >
  );
}