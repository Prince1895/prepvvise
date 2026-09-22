import 'server-only'
import { AIProvider, AIRequestParams, AIResponse, ProviderName } from '@/lib/ai/AIProvider'

export class CloudflareProvider implements AIProvider {
  public name: ProviderName = 'cloudflare'

  public async isAvailable(): Promise<boolean> {
    return Boolean(
      process.env.CLOUDFLARE_ACCOUNT_ID &&
      process.env.CLOUDFLARE_API_TOKEN &&
      process.env.CLOUDFLARE_ACCOUNT_ID.trim().length > 0 &&
      process.env.CLOUDFLARE_API_TOKEN.trim().length > 0
    )
  }

  public async chat(params: AIRequestParams): Promise<AIResponse> {
    const accountId = process.env.CLOUDFLARE_ACCOUNT_ID
    const apiToken = process.env.CLOUDFLARE_API_TOKEN
    const model = process.env.CLOUDFLARE_MODEL || '@cf/meta/llama-3.1-8b-instruct'

    if (!accountId || !apiToken) {
      throw new Error('CLOUDFLARE_ACCOUNT_ID or CLOUDFLARE_API_TOKEN is missing.')
    }

    const endpoint = `https://api.cloudflare.com/client/v4/accounts/${accountId}/ai/run/${model}`
    const controller = new AbortController()
    const timeoutMs = Number(process.env.AI_CODING_REQUEST_TIMEOUT_MS) || 15_000
    const timer = setTimeout(() => controller.abort(), timeoutMs)

    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: {
          authorization: `Bearer ${apiToken}`,
          'content-type': 'application/json',
        },
        body: JSON.stringify({
          messages: params.messages,
          max_tokens: params.maxOutputTokens || 200,
          temperature: params.temperature ?? 0.3,
        }),
        cache: 'no-store',
        signal: controller.signal,
      })

      if (!res.ok) {
        const errorText = await res.text().catch(() => '')
        const err = new Error(`Cloudflare Workers AI request failed (${res.status}): ${errorText}`)
        ;(err as any).status = res.status
        throw err
      }

      const data = await res.json()
      const text = data.result?.response?.trim() || data.result?.description?.trim() || ''

      if (!text) {
        throw new Error('Cloudflare Workers AI returned an empty response.')
      }

      return {
        text,
        provider: 'cloudflare',
        inputTokens: data.result?.usage?.prompt_tokens || Math.ceil(JSON.stringify(params.messages).length / 4),
        outputTokens: data.result?.usage?.completion_tokens || Math.ceil(text.length / 4),
      }
    } finally {
      clearTimeout(timer)
    }
  }
}
