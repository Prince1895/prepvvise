import 'server-only'

import { generateCodingAssistance } from '@/lib/ai/gemini'
import { generateWithGroq } from '@/lib/ai/groq'
import type { GeminiAssistInput, GeminiAssistResult } from '@/lib/ai/gemini'

// GROQ primary -> Gemini fallback -> deterministic offline fallback.
// Never throws for missing keys; offline text keeps practice usable.
export async function generateAssistance(input: GeminiAssistInput): Promise<GeminiAssistResult> {
  if (process.env.GROQ_API_KEY) {
    try {
      return await generateWithGroq(input)
    } catch {
      // fall through to Gemini/offline
    }
  }
  if (process.env.GEMINI_API_KEY) {
    try {
      return await generateCodingAssistance(input)
    } catch {
      // fall through to offline
    }
  }
  return {
    text: [
      'AI coach is offline (no GROQ/GEMINI key on server).',
      `Goal: ${input.problem}`.slice(0, 500),
      'Next: break the task into inputs/outputs, one edge case, then retry.',
    ].join('\n'),
    inputTokens: 0,
    outputTokens: 0,
  }
}
