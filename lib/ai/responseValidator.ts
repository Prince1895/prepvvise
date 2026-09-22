export function containsDirectSolutionCode(text: string): boolean {
  if (!text) return false

  // Detect code blocks containing complete solution algorithms
  const codeBlockRegex = /```(?:[a-z]*)\n?([\s\S]*?)```/gi
  let match: RegExpExecArray | null

  while ((match = codeBlockRegex.exec(text)) !== null) {
    const code = match[1] || ''
    if (
      code.includes('return ') &&
      (code.includes('for ') || code.includes('while ') || code.includes('function ') || code.includes('def ') || code.includes('public static'))
    ) {
      return true
    }
  }

  // Detect copy-paste function declarations
  if (
    /function\s+\w+\s*\([^)]*\)\s*\{[\s\S]*return[\s\S]*\}/i.test(text) ||
    /def\s+\w+\s*\([^)]*\):[\s\S]*return/i.test(text) ||
    /static\s+[\w<>[\]]+\s+\w+\s*\([^)]*\)\s*\{[\s\S]*return/i.test(text)
  ) {
    return true
  }

  return false
}

export function validateTutorResponse(text: string): { isValid: boolean; reason?: string } {
  if (!text || text.trim().length === 0) {
    return { isValid: false, reason: 'Empty response' }
  }

  if (containsDirectSolutionCode(text)) {
    return { isValid: false, reason: 'Response contains direct solution code' }
  }

  if (text.length > 2000) {
    return { isValid: false, reason: 'Response is excessively long' }
  }

  return { isValid: true }
}

export function getSafeDeterministicHint(problemTitle?: string, topic?: string): string {
  const topicName = topic || 'DSA'
  const title = problemTitle ? ` for "${problemTitle}"` : ''

  return `To reason through the solution${title}, consider the core property of ${topicName}. Think about what values or state you need to track as you iterate, and ask yourself which data structure gives the optimal lookup time.`
}
