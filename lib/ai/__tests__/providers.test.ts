import 'dotenv/config'
import { containsDirectSolutionCode, validateTutorResponse, getSafeDeterministicHint } from '../responseValidator'
import { providerHealthTracker } from '../providerHealth'

async function runProviderTests() {
  console.log('--- Testing Response Guardrail Validation ---')

  const violatingCode = '```javascript\nfunction solve(a) {\n  return a.filter(x => x > 0);\n}\n```'
  if (!containsDirectSolutionCode(violatingCode)) {
    throw new Error('Failed to detect direct solution code block')
  }

  const validText = 'To find the matching target value, consider scanning the array while maintaining a set of previously seen elements.'
  if (containsDirectSolutionCode(validText)) {
    throw new Error('Misidentified valid conceptual hint as direct code')
  }

  const valResult = validateTutorResponse(violatingCode)
  if (valResult.isValid) {
    throw new Error('Tutor response validator failed to invalidate solution code')
  }

  const safeHint = getSafeDeterministicHint('Two Sum', 'Arrays + Hashing')
  if (!safeHint.includes('Two Sum') || !safeHint.includes('Arrays + Hashing')) {
    throw new Error('Safe deterministic hint template generation failed')
  }
  console.log('✓ Guardrail response validation tests passed!')

  console.log('--- Testing Provider Health Tracker ---')
  providerHealthTracker.markHealthy('groq')
  if (providerHealthTracker.isDegraded('groq')) {
    throw new Error('Groq misidentified as degraded')
  }

  providerHealthTracker.markDegraded('groq', 'Simulated 429')
  if (!providerHealthTracker.isDegraded('groq')) {
    throw new Error('Groq failed to transition to degraded state')
  }

  providerHealthTracker.markHealthy('groq')
  if (providerHealthTracker.isDegraded('groq')) {
    throw new Error('Groq failed to recover to healthy state')
  }
  console.log('✓ Provider health tracker tests passed!')

  console.log('--- Testing Provider Adapters ---')
  const { GroqProvider } = await import('../providers/GroqProvider')
  const { GeminiProvider } = await import('../providers/GeminiProvider')

  const groq = new GroqProvider()
  const groqAvailable = await groq.isAvailable()
  console.log(`Groq Provider available: ${groqAvailable}`)

  const gemini = new GeminiProvider()
  const geminiAvailable = await gemini.isAvailable()
  console.log(`Gemini Provider available: ${geminiAvailable}`)

  if (groqAvailable) {
    const res = await groq.chat({
      messages: [
        { role: 'system', content: 'You are a concise AI assistant.' },
        { role: 'user', content: 'Say hello in 1 sentence.' },
      ],
      maxOutputTokens: 50,
    })
    console.log('Groq Chat Result:', res)
    if (res.provider !== 'groq' || !res.text) {
      throw new Error('Groq provider response invalid')
    }
  }

  if (geminiAvailable) {
    const res = await gemini.chat({
      messages: [
        { role: 'system', content: 'You are a concise AI assistant.' },
        { role: 'user', content: 'Say hello in 1 sentence.' },
      ],
      maxOutputTokens: 50,
    })
    console.log('Gemini Chat Result:', res)
    if (res.provider !== 'gemini' || !res.text) {
      throw new Error('Gemini provider response invalid')
    }
  }

  console.log('--- Testing AIProviderManager Fallback Chain ---')
  const { AIProviderManager } = await import('../AIProviderManager')
  const manager = new AIProviderManager()

  // Test manager chat
  const managerRes = await manager.chat({
    messages: [
      { role: 'system', content: 'You are Prepvvise AI Coding Tutor.' },
      { role: 'user', content: 'What is the goal of Two Sum?' },
    ],
    maxOutputTokens: 100,
  })

  console.log('Manager Chat Result:', managerRes)
  if (!managerRes.text || !managerRes.provider) {
    throw new Error('AIProviderManager failed to return valid response')
  }

  console.log('--- Testing Simulated Failure Fallback (Groq -> Fallback) ---')
  process.env.AI_SIMULATE_PROVIDER_FAILURE = 'groq'
  const fallbackRes = await manager.chat({
    messages: [
      { role: 'system', content: 'You are Prepvvise AI Coding Tutor.' },
      { role: 'user', content: 'Give me a hint for Two Sum.' },
    ],
    maxOutputTokens: 100,
  })

  console.log('Fallback Chat Result:', fallbackRes)
  if (fallbackRes.provider === 'groq') {
    throw new Error('Failed to fallback away from Groq when failure was simulated!')
  }

  // Clear simulation
  delete process.env.AI_SIMULATE_PROVIDER_FAILURE

  console.log('All multi-provider AI tests passed successfully!')
}

runProviderTests().catch((err) => {
  console.error('Test failed:', err)
  process.exit(1)
})
