import 'server-only'

export type GroqAssistInput = {
  problem: string
  currentCode: string
  context?: string
  testOutput?: string
  request: string
}

export type GroqAssistResult = {
  text: string
  inputTokens: number
  outputTokens: number
}

export class GroqClientError extends Error {}

// Rough token estimate for usage accounting when provider omits usage.
function estimateTokens(text: string) {
  return Math.max(1, Math.ceil(text.length / 4))
}

const SYSTEM = [
  'You are PrepVvise AI coach.',
  'Help the student reason about the problem and code.',
  'Do not claim code was executed or tests passed.',
  'Prefer explanation, edge cases, complexity, small fixes.',
].join(' ')

export async function generateWithGroq(input: GroqAssistInput): Promise<GroqAssistResult> {
  const apiKey = process.env.GROQ_API_KEY
  if (!apiKey) throw new GroqClientError('Groq is not configured.')
  const model = process.env.GROQ_MODEL ?? 'qwen/qwen3.8-27b'
  const prompt = [
    `Problem: ${input.problem}`,
    `Current code: ${input.currentCode}`,
    `Context: ${input.context || '(none)'}`,
    `Test output: ${input.testOutput || '(none)'}`,
    `Student request: ${input.request}`,
  ].join('\n')

  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), 25_000)
  try {
    const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: { authorization: `Bearer ${apiKey}`, 'content-type': 'application/json' },
      body: JSON.stringify({
        model,
        messages: [
          { role: 'system', content: SYSTEM },
          { role: 'user', content: prompt },
        ],
        temperature: 0.4,
        max_tokens: 1500,
      }),
      cache: 'no-store',
      signal: controller.signal,
    })
    if (!res.ok) throw new GroqClientError(`Groq request failed (${res.status}).`)
    const data = (await res.json()) as {
      choices?: Array<{ message?: { content?: string } }>
      usage?: { prompt_tokens?: number; completion_tokens?: number }
    }
    const text = data.choices?.[0]?.message?.content?.trim()
    if (!text) throw new GroqClientError('Groq returned an empty response.')
    return {
      text,
      inputTokens: data.usage?.prompt_tokens ?? estimateTokens(SYSTEM + prompt),
      outputTokens: data.usage?.completion_tokens ?? estimateTokens(text),
    }
  } catch (e) {
    if (e instanceof GroqClientError) throw e
    throw new GroqClientError('Groq assistance is temporarily unavailable.')
  } finally {
    clearTimeout(timer)
  }
}
