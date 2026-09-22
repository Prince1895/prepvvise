import { ProviderName } from '@/lib/ai/AIProvider'

interface HealthState {
  status: 'healthy' | 'degraded'
  degradedUntil?: number
  lastError?: string
}

export class ProviderHealthTracker {
  private states: Map<ProviderName, HealthState> = new Map()

  private getCooldownMs(): number {
    return Number(process.env.AI_CODING_PROVIDER_COOLDOWN_MS) || 60_000
  }

  public markDegraded(provider: ProviderName, reason?: string): void {
    const degradedUntil = Date.now() + this.getCooldownMs()
    this.states.set(provider, {
      status: 'degraded',
      degradedUntil,
      lastError: reason || 'Temporary provider failure',
    })
    console.warn(`[AI Provider Health] Provider '${provider}' marked as degraded for ${this.getCooldownMs() / 1000}s. Reason: ${reason || 'unknown'}`)
  }

  public markHealthy(provider: ProviderName): void {
    this.states.set(provider, {
      status: 'healthy',
    })
  }

  public isDegraded(provider: ProviderName): boolean {
    const state = this.states.get(provider)
    if (!state || state.status === 'healthy') return false

    if (state.degradedUntil && Date.now() >= state.degradedUntil) {
      // Cooldown expired, restore health
      this.markHealthy(provider)
      return false
    }

    return true
  }

  public getHealthStatus(): Record<string, any> {
    const status: Record<string, any> = {}
    const providers: ProviderName[] = ['groq', 'gemini', 'cloudflare', 'openrouter']

    for (const p of providers) {
      const isDeg = this.isDegraded(p)
      const state = this.states.get(p)
      status[p] = {
        status: isDeg ? 'degraded' : 'healthy',
        lastError: state?.lastError,
        degradedUntil: state?.degradedUntil,
      }
    }

    return status
  }
}

export const providerHealthTracker = new ProviderHealthTracker()
