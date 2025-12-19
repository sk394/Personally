// import { chat } from '@tanstack/ai'
// import { gemini } from '@tanstack/ai-gemini'
// import { createServerFn } from '@tanstack/react-start'

// // Stream chat response
// export const streamChatResponse = createServerFn({
//     method: 'POST',
// }).handler(async function* (ctx) {

//     if (!ctx.data) {
//         console.error('[streamChatResponse] No data in context')
//         throw new Error('Stream data required')
//     }

//     const data = ctx.data as {
//         messages: Array<{
//             role: 'user' | 'assistant'
//             content: string | Array<{ type: string; content?: string; source?: any }>
//         }>
//         model?: string
//     }

//     const model = 'gemini-2.5-flash'

//     // Filter out empty messages
//     const filteredMessages = data.messages.filter((m) => {
//         if (typeof m.content === 'string') {
//             return m.content && m.content.trim().length > 0
//         }
//         return m.content && m.content.length > 0
//     })

//     // Check API key
//     if (!process.env.VITE_GEMINI_API_KEY) {
//         throw new Error('VITE_GEMINI_API_KEY not configured')
//     }

//     // Get Gemini adapter
//     const adapter = gemini({
//         apiKey: process.env.VITE_GEMINI_API_KEY
//     } as any)

//     // Stream chat response
//     const stream = chat({
//         adapter: adapter as any,
//         model: model as any,
//         messages: filteredMessages as any,
//     })

//     let chunkCount = 0
//     for await (const chunk of stream) {
//         chunkCount++
//         if (chunk.type === 'content') {
//             yield { type: 'content', content: chunk.content }
//         }
//     }
// })
