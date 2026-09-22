import 'server-only'
import { GoogleGenerativeAI } from '@google/generative-ai'
import { AIProvider, AIRequestParams, AIResponse, ProviderName } from '@/lib/ai/AIProvider'

export class GeminiProvider implements AIProvider {
  public name: ProviderName = 'gemini'

  public async isAvailable(): Promise<boolean> {
    return Boolean(process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY.trim().length > 0)
  }

  public async chat(params: AIRequestParams): Promise<AIResponse> {
    const apiKey = process.env.GEMINI_API_KEY
    if (!apiKey) {
      throw new Error('GEMINI_API_KEY is not configured.')
    }

    const modelName = process.env.GEMINI_MODEL || 'gemini-2.0-flash'
    const genAI = new GoogleGenerativeAI(apiKey)

    // Separate system message from user/assistant history
    const systemMessages = params.messages.filter((m) => m.role === 'system')
    const systemInstruction = systemMessages.map((m) => m.content).join('\n\n')

    const chatMessages = params.messages.filter((m) => m.role !== 'system')

    const model = genAI.getGenerativeModel({
      model: modelName,
      systemInstruction: systemInstruction || undefined,
      generationConfig: {
        maxOutputTokens: params.maxOutputTokens || 200,
        temperature: params.temperature ?? 0.3,
      },
    })

    // Format chat history for Gemini
    const contents = chatMessages.map((m) => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: m.content }],
    }))

    try {
      const result = await model.generateContent({ contents })
      const response = result.response
      const text = response.text()?.trim() || ''

      if (!text) {
        throw new Error('Gemini returned an empty response.')
      }

      return {
        text,
        provider: 'gemini',
        inputTokens: response.usageMetadata?.promptTokenCount || 0,
        outputTokens: response.usageMetadata?.candidatesTokenCount || 0,
      }
    } catch (err: any) {
      if (err?.status) {
        throw err
      }
      const newErr = new Error(`Gemini request failed: ${err?.message || 'unknown error'}`)
      ;(newErr as any).status = err?.status || 500
      throw newErr
    }
  }
}
