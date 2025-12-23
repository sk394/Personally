import { motion } from 'motion/react'
import { Link, useNavigate } from '@tanstack/react-router'
import { Bot, Send, User } from 'lucide-react'
import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'

const DEMO_MESSAGES = [
    { role: 'user', content: "Hey, can you help me create a loan for Sarah?" },
    { role: 'assistant', content: "Of course! I'll help you set up a new loan for Sarah. How much is the principal amount?" },
    { role: 'user', content: "$500. She'll pay me back next month." },
    { role: 'assistant', content: "Got it. $500 for Sarah. I've noted that it's a lent loan. Anything else?" },
]

export function LandingChat() {
    const navigate = useNavigate()
    const [input, setInput] = useState('')
    const [visibleMessages, setVisibleMessages] = useState<typeof DEMO_MESSAGES>([])

    useEffect(() => {
        let isCancelled = false

        const showMessages = async () => {
            for (let i = 0; i < DEMO_MESSAGES.length; i++) {
                await new Promise(resolve => setTimeout(resolve, i === 0 ? 500 : 1500))
                if (!isCancelled) {
                    setVisibleMessages(prev => [...prev, DEMO_MESSAGES[i]])
                }
            }
        }

        showMessages()

        return () => {
            isCancelled = true
        }
    }, [])

    return (
        <div className="w-full max-w-2xl mx-auto mt-12 overflow-hidden rounded-2xl border border-border bg-card/50 shadow-2xl backdrop-blur-md">
            <div className="flex items-center gap-3 border-b border-border bg-muted/30 px-6 py-4">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/20 text-primary">
                    <Bot size={18} />
                </div>
                <div className="flex flex-col">
                    <span className="text-sm font-semibold">Personally Assistant</span>
                    <span className="text-[10px] text-muted-foreground uppercase tracking-widest">Always Active</span>
                </div>
            </div>
            <div className="h-[350px] overflow-y-auto p-6 space-y-6 flex flex-col">
                {visibleMessages.map((msg, idx) => (
                    <motion.div
                        key={idx}
                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                        <div
                            className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm flex gap-3 ${msg.role === 'user'
                                ? 'bg-primary text-primary-foreground shadow-lg'
                                : 'bg-muted text-foreground'
                                }`}
                        >
                            {msg.role === 'assistant' && (
                                <div className="mt-0.5 shrink-0">
                                    <Bot size={14} className="opacity-50" />
                                </div>
                            )}
                            <p className="leading-relaxed">{msg.content}</p>
                            {msg.role === 'user' && (
                                <div className="mt-0.5 shrink-0">
                                    <User size={14} className="opacity-50" />
                                </div>
                            )}
                        </div>
                    </motion.div>
                ))}
            </div>

            <div className="p-4 bg-muted/20 border-t flex gap-2">
                <input
                    type="text"
                    placeholder="Ask anything (e.g., 'Track expenses')"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    className="flex-1 bg-transparent border-none text-sm py-2 px-2 focus:outline-none focus:ring-0"
                />
                <Link to="/dashboard" disabled={!input}>
                    <Button
                        type="submit"
                        className="h-10 w-10 flex items-center justify-center rounded-xl bg-primary text-primary-foreground hover:scale-105 transition-transform"
                        disabled={!input}
                    >
                        <Send size={18} />
                    </Button>
                </Link>
            </div>

            <div className="px-6 py-2 bg-primary/5 text-center">
                <p className="text-[10px] text-muted-foreground">
                    Type and search to open the full dashboard experience
                </p>
            </div>
        </div>
    )
}
