export const DEFAULT_TIMEOUT_MS = 3000
export const DEFAULT_OUTPUT_LIMIT_BYTES = 100 * 1024 // 100 KB

export function isOutputLimitExceeded(text: string, maxBytes: number = DEFAULT_OUTPUT_LIMIT_BYTES): boolean {
  return new TextEncoder().encode(text).length > maxBytes
}

export function truncateToLimit(text: string, maxBytes: number = DEFAULT_OUTPUT_LIMIT_BYTES): string {
  const encoder = new TextEncoder()
  const bytes = encoder.encode(text)
  if (bytes.length <= maxBytes) return text

  const decoder = new TextDecoder('utf-8')
  return decoder.decode(bytes.slice(0, maxBytes)) + '\n...[Output truncated: limit exceeded]'
}
