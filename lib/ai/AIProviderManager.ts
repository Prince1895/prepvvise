import 'server-only'
import { AIProvider, AIRequestParams, AIResponse, ProviderName } from '@/lib/ai/AIProvider'
import { GroqProvider } from '@/lib/ai/providers/GroqProvider'
import { GeminiProvider } from '@/lib/ai/providers/GeminiProvider'
import { CloudflareProvider } from '@/lib/ai/providers/CloudflareProvider'
import { OpenRouterProvider } from '@/lib/ai/providers/OpenRouterProvider'
import { providerHealthTracker } from '@/lib/ai/providerHealth'
import { getSafeDeterministicHint, validateTutorResponse } from '@/lib/ai/responseValidator'

export class AIProviderManager {
  private providers: AIProvider[] = [
    new GroqProvider(),
    new GeminiProvider(),
    new CloudflareProvider(),
    new OpenRouterProvider(),
  ]

  /**
   * Helper to check if an error qualifies for fallback to the next provider.
   */
  private isFallbackEligible(error: any): boolean {
    if (!error) return true
    const status = error.status || error.statusCode

    // Fallback on rate limit (429), quota, server error (5xx), timeout (AbortError), or network failure
    if (status === 429 || status === 403 || status === 404 || (status >= 500 && status < 600)) {
      return true
    }

    if (error.name === 'AbortError' || error.message?.includes('timeout') || error.message?.includes('fetch failed')) {
      return true
    }

    return true
  }

  /**
   * Executes AI chat request across the provider fallback chain.
   */
  public async chat(
    params: AIRequestParams,
    problemTitle?: string,
    topic?: string
  ): Promise<AIResponse> {
    const simulatedFailure = process.env.NODE_ENV !== 'production' ? process.env.AI_SIMULATE_PROVIDER_FAILURE : null
    let lastError: Error | null = null

    for (let i = 0; i < this.providers.length; i++) {
      const provider = this.providers[i]
      const name = provider.name

      // Check simulated failure in development mode
      if (simulatedFailure && simulatedFailure.toLowerCase() === name) {
        console.warn(`[AI SIMULATION] Simulating 429 rate limit failure for provider '${name}'`)
        providerHealthTracker.markDegraded(name, 'Simulated 429 rate limit')
        lastError = new Error(`Simulated 429 rate limit on ${name}`)
        ;(lastError as any).status = 429
        continue
      }

      // Check if provider is configured / available
      const available = await provider.isAvailable().catch(() => false)
      if (!available) {
        continue
      }

      // Check if provider is in cooldown
      if (providerHealthTracker.isDegraded(name)) {
        console.info(`[AI Provider Manager] Skipping degraded provider '${name}' during cooldown.`)
        continue
      }

      const startTime = performance.now()
      try {
        console.info(`[AI Provider Manager] Attempting provider '${name}'...`)
        let response = await provider.chat(params)
        const latencyMs = Math.round(performance.now() - startTime)

        // Validate response guardrails
        const valResult = validateTutorResponse(response.text)
        if (!valResult.isValid) {
          console.warn(`[AI Guardrail] Response from '${name}' violated tutor rules: ${valResult.reason}. Attempting strict re-prompt...`)

          // Attempt 1 re-prompt with strict instruction
          const retryParams: AIRequestParams = {
            ...params,
            messages: [
              ...params.messages,
              { role: 'assistant', content: response.text },
              {
                role: 'user',
                content: 'Your previous response contained direct implementation code, which violates tutoring rules. Rewrite your explanation as a concise, conceptual hint without code blocks.',
              },
            ],
            temperature: 0.2,
          }

          try {
            const retryRes = await provider.chat(retryParams)
            const retryVal = validateTutorResponse(retryRes.text)

            if (retryVal.isValid) {
              response = retryRes
            } else {
              // Fallback to safe deterministic hint template
              response = {
                text: getSafeDeterministicHint(problemTitle, topic),
                provider: name,
                inputTokens: response.inputTokens + retryRes.inputTokens,
                outputTokens: response.outputTokens + retryRes.outputTokens,
              }
            }
          } catch {
            response = {
              text: getSafeDeterministicHint(problemTitle, topic),
              provider: name,
              inputTokens: response.inputTokens,
              outputTokens: response.outputTokens,
            }
          }
        }

        // Mark provider healthy and return response
        providerHealthTracker.markHealthy(name)
        console.info(`[AI Provider Manager] Successfully received response from '${name}' in ${latencyMs}ms.`)

        return response
      } catch (err: any) {
        const latencyMs = Math.round(performance.now() - startTime)
        lastError = err instanceof Error ? err : new Error(String(err))
        console.error(`[AI Provider Manager] Provider '${name}' failed after ${latencyMs}ms:`, lastError.message)

        if (this.isFallbackEligible(err)) {
          providerHealthTracker.markDegraded(name, lastError.message)
          continue
        } else {
          // Non-fallback-eligible error (e.g. fatal application configuration bug)
          break
        }
      }
    }

    // All providers failed or were unavailable
    console.error('[AI Provider Manager] All AI providers failed or were unavailable.', lastError?.message)
    throw new Error('AI assistance is temporarily unavailable. Please try again shortly.')
  }
}

export const aiProviderManager = new AIProviderManager()
