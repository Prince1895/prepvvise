export type ProviderName = 'groq' | 'gemini' | 'cloudflare' | 'openrouter'

export interface AIMessage {
  role: 'system' | 'user' | 'assistant'
  content: string
}

export interface AIRequestParams {
  messages: AIMessage[]
  maxOutputTokens: number
  temperature?: number
}

export interface AIResponse {
  text: string
  provider: ProviderName
  inputTokens: number
  outputTokens: number
}

export interface AIProvider {
  name: ProviderName
  chat(params: AIRequestParams): Promise<AIResponse>
  isAvailable(): Promise<boolean>
}
