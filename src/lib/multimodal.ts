import type { ContentPart } from '@tanstack/ai'

export type ProviderType = 'openai' | 'anthropic' | 'gemini' | 'ollama'

export interface AttachedFile {
    id: string
    name: string
    type: string
    size: number
    data: string // base64
    preview?: string // URL for preview
}
export interface Message {
    id: string
    role: 'user' | 'assistant'
    content: string
    createdAt: Date
    files?: AttachedFile[] // Attached images
}

interface FormattedMessage {
    role: 'user' | 'assistant'
    content: string | ContentPart[]
}

/** Extracts raw base64 data from a data URL */
export function parseDataUrl(dataUrl: string): { mediaType: string; base64Data: string } {
    const match = dataUrl.match(/^data:([^;]+);base64,(.+)$/s)
    if (match) return { mediaType: match[1], base64Data: match[2].trim() }
    return { mediaType: 'image/png', base64Data: dataUrl.trim() }
}

/** Formats an image for a specific AI provider */
export function formatImageForProvider(file: AttachedFile, provider: ProviderType): ContentPart {
    const base64Data = parseDataUrl(file.data).base64Data

    switch (provider) {
        case 'anthropic':
        case 'gemini':
            return {
                type: 'image',
                source: { type: 'data', value: base64Data },
            } as ContentPart

        case 'openai':
        default:
            return {
                type: 'image',
                source: { type: 'url', value: file.data },
            } as ContentPart
    }
}

/** Creates ContentParts array (text + images) for a message */
function formatMessageContent(text: string, files: AttachedFile[], provider: ProviderType): ContentPart[] {
    return [
        { type: 'text', content: text } as ContentPart,
        ...files.map((file) => formatImageForProvider(file, provider)),
    ]
}

/** Builds the messages array for streaming, handling multimodal content */
export function buildMessagesForStream(
    messages: Message[],
    userContent: string,
    files: AttachedFile[] | undefined,
    supportsVision: boolean,
    provider: ProviderType = 'gemini'
): FormattedMessage[] {
    const hasFiles = files && files.length > 0

    if (!hasFiles || !supportsVision) {
        return [
            ...messages.map((m) => ({ role: m.role, content: m.content })),
            { role: 'user' as const, content: userContent },
        ]
    }

    const previousMessages = messages
        .filter((m) => m.content && m.content.trim().length > 0)
        .map((m) => ({ role: m.role, content: m.content }))

    return [
        ...previousMessages,
        { role: 'user' as const, content: formatMessageContent(userContent, files, provider) },
    ]
}