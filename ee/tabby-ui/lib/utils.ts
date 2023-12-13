import { clsx, type ClassValue } from 'clsx'
import { customAlphabet } from 'nanoid'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const nanoid = customAlphabet(
  '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz',
  7
) // 7-character random string

export async function fetcher<JSON = any>(
  input: RequestInfo,
  init?: RequestInit
): Promise<JSON> {
  const res = await fetch(input, init)

  if (!res.ok) {
    const json = await res.json()
    if (json.error) {
      const error = new Error(json.error) as Error & {
        status: number
      }
      error.status = res.status
      throw error
    } else {
      throw new Error('An unexpected error occurred')
    }
  }

  return res.json()
}

export function formatDate(input: string | number | Date): string {
  const date = new Date(input)
  return date.toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric'
  })
}

function truncateText(
  text: string,
  maxLength = 50,
  delimiters = /[ ,.:;\n，。：；]/
) {
  if (!text) return ''
  if (text.length <= maxLength) {
    return text
  }

  let truncatedText = text.slice(0, maxLength)

  let lastDelimiterIndex = -1
  for (let i = maxLength - 1; i >= 0; i--) {
    if (delimiters.test(truncatedText[i])) {
      lastDelimiterIndex = i
      break
    }
  }

  if (lastDelimiterIndex !== -1) {
    truncatedText = truncatedText.slice(0, lastDelimiterIndex)
  }

  return truncatedText + '...'
}

export async function fetchGeneratedTitle(text: string, accessToken?: string) {
  if (!accessToken) return "(Untitled)";
  const serverUrl = process.env.NEXT_PUBLIC_TABBY_SERVER_URL || ''
  const headers: HeadersInit = {
    'Content-Type': 'application/json'
  }
  headers['Authorization'] = `Bearer ${accessToken}`
  const res = await fetch(`${serverUrl}/v1beta/chat/completions`, {
    headers,
    body: JSON.stringify({
      messages: [
        { role: "user", content: "Please summarize content after '===' into a single sentence, do not use any quotes:\n===\n" + text }
      ]
    }),
    method: "POST"
  });

  const data = await res.text();
  let title = data.split(/\r?\n/).filter(x => x.trim()).map(x => JSON.parse(x.trim()).content).join("").trim();
  if (title.startsWith("\"")) title = title.slice(1);
  if (title.endsWith("\"")) title = title.slice(0, title.length - 1)
  return truncateText(title);
}