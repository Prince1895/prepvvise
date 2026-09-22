import 'server-only'
import { AIProvider, AIRequestParams, AIResponse, ProviderName } from '@/lib/ai/AIProvider'

export class OpenRouterProvider implements AIProvider {
  public name: ProviderName = 'openrouter'

  public async isAvailable(): Promise<boolean> {
    return Boolean(process.env.OPENROUTER_API_KEY && process.env.OPENROUTER_API_KEY.trim().length > 0)
  }

  public async chat(params: AIRequestParams): Promise<AIResponse> {
    const apiKey = process.env.OPENROUTER_API_KEY
    if (!apiKey) {
      throw new Error('OPENROUTER_API_KEY is not configured.')
    }

    const model = process.env.OPENROUTER_MODEL || 'google/gemma-2-9b-it:free'
    const controller = new AbortController()
    const timeoutMs = Number(process.env.AI_CODING_REQUEST_TIMEOUT_MS) || 15_000
    const timer = setTimeout(() => controller.abort(), timeoutMs)

    try {
      const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          authorization: `Bearer ${apiKey}`,
          'HTTP-Referer': 'https://prepvvise.local',
          'X-Title': 'Prepvvise AI Coding Tutor',
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
        const err = new Error(`OpenRouter request failed (${res.status}): ${errorText}`)
        ;(err as any).status = res.status
        throw err
      }

      const data = await res.json()
      const text = data.choices?.[0]?.message?.content?.trim() || ''

      if (!text) {
        throw new Error('OpenRouter returned an empty response.')
      }

      return {
        text,
        provider: 'openrouter',
        inputTokens: data.usage?.prompt_tokens || Math.ceil(JSON.stringify(params.messages).length / 4),
        outputTokens: data.usage?.completion_tokens || Math.ceil(text.length / 4),
      }
    } finally {
      clearTimeout(timer)
    }
  }
}
