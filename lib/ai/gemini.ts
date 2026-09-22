import 'server-only'

import { GoogleGenerativeAI } from '@google/generative-ai'

export type GeminiAssistInput = {
  problem: string
  currentCode: string
  context?: string
  testOutput?: string
  request: string
}

export type GeminiAssistResult = {
  text: string
  inputTokens: number
  outputTokens: number
}

export class GeminiClientError extends Error {}

const systemInstruction = [
  'You are PrepVvise AI Coding Coach.',
  'Help the student reason about the provided DSA problem and code.',
  'Do not claim that code was executed or that tests passed.',
  'Do not provide secrets, unsafe execution instructions, or unrelated content.',
  'Prefer explanation, edge cases, complexity analysis, and small corrective suggestions.',
].join(' ')

export async function generateCodingAssistance(input: GeminiAssistInput): Promise<GeminiAssistResult> {
  const apiKey = process.env.GEMINI_API_KEY

  if (!apiKey) {
    throw new GeminiClientError('Gemini is not configured.')
  }

  const client = new GoogleGenerativeAI(apiKey)
  const model = client.getGenerativeModel({
    model: process.env.GEMINI_MODEL ?? 'gemini-2.0-flash',
    systemInstruction,
  })

  const prompt = [
    'Problem:', input.problem,
    '\nCurrent code:', input.currentCode,
    '\nSelected context:', input.context || '(none)',
    '\nRelevant test output:', input.testOutput || '(none)',
    '\nStudent request:', input.request,
    '\nRespond with concise reasoning and actionable next steps.',
  ].join('\n')

  try {
    const result = await model.generateContent(prompt)
    const response = result.response

    return {
      text: response.text(),
      inputTokens: response.usageMetadata?.promptTokenCount ?? 0,
      outputTokens: response.usageMetadata?.candidatesTokenCount ?? 0,
    }
  } catch {
    throw new GeminiClientError('Gemini assistance is temporarily unavailable.')
  }
}