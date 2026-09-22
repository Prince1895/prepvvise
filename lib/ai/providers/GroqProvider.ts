import 'server-only'
import { AIProvider, AIRequestParams, AIResponse, ProviderName } from '@/lib/ai/AIProvider'

export class GroqProvider implements AIProvider {
  public name: ProviderName = 'groq'

  public async isAvailable(): Promise<boolean> {
    return Boolean(process.env.GROQ_API_KEY && process.env.GROQ_API_KEY.trim().length > 0)
  }

  public async chat(params: AIRequestParams): Promise<AIResponse> {
    const apiKey = process.env.GROQ_API_KEY
    if (!apiKey) {
      throw new Error('GROQ_API_KEY is not configured.')
    }

    const model = process.env.GROQ_MODEL || 'qwen/qwen3.8-27b'
    const controller = new AbortController()
    const timeoutMs = Number(process.env.AI_CODING_REQUEST_TIMEOUT_MS) || 15_000
    const timer = setTimeout(() => controller.abort(), timeoutMs)

    try {
      const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          authorization: `Bearer ${apiKey}`,
          'content-type': 'application/json',
        },
        body: JSON.stringify({
          model,
          messages: params.messages,
          temperature: params.temperature ?? 0.3,
          max_tokens: params.maxOutputTokens || 200,
        }),
        cache: 'no-store',
        signal: controller.signal,
      })

      if (!res.ok) {
        const errorText = await res.text().catch(() => '')
        const err = new Error(`Groq request failed (${res.status}): ${errorText}`)
        ;(err as any).status = res.status
        throw err
      }

      const data = await res.json()
      const text = data.choices?.[0]?.message?.content?.trim() || ''

      if (!text) {
        throw new Error('Groq returned an empty response.')
      }

      return {
        text,
        provider: 'groq',
        inputTokens: data.usage?.prompt_tokens || 0,
        outputTokens: data.usage?.completion_tokens || 0,
      }
    } finally {
      clearTimeout(timer)
    }
  }
}
