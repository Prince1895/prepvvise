export interface ListeningAudioMetadata {
  audioId: string
  audioUrl?: string
  script: string
  durationSeconds?: number
  playbackPolicy: 'one_time_only'
  maxPlays: 1
}

export function createListeningAudioMetadata(
  questionId: string,
  script: string,
  audioUrl?: string
): ListeningAudioMetadata {
  const wordCount = script.trim().split(/\s+/).length
  // Estimated duration in seconds at 0.88x gentle rate (~130 wpm)
  const durationSeconds = Math.max(10, Math.ceil((wordCount / 130) * 60))

  return {
    audioId: `ls-audio-${questionId}`,
    audioUrl,
    script,
    durationSeconds,
    playbackPolicy: 'one_time_only',
    maxPlays: 1,
  }
}

export function parseDialogueScript(rawText: string): Array<{ speaker: string; text: string }> {
  if (!rawText || !rawText.trim()) return [{ speaker: 'Narrator', text: '' }]

  const regex = /([A-Za-z0-9\s]+):\s*/g
  const matches = Array.from(rawText.matchAll(regex))

  if (matches.length === 0) {
    return [{ speaker: 'Narrator', text: rawText.trim() }]
  }

  const turns: Array<{ speaker: string; text: string }> = []
  for (let i = 0; i < matches.length; i++) {
    const speaker = matches[i][1].trim()
    const startIndex = matches[i].index! + matches[i][0].length
    const endIndex = i + 1 < matches.length ? matches[i + 1].index! : rawText.length
    const speech = rawText.slice(startIndex, endIndex).trim()
    if (speech) {
      turns.push({ speaker, text: speech })
    }
  }
  return turns.length > 0 ? turns : [{ speaker: 'Narrator', text: rawText.trim() }]
}

export function getVoiceQualityScore(voice: SpeechSynthesisVoice): number {
  let score = 0
  const nameLower = voice.name.toLowerCase()

  // Soft female and gentle natural voices score highest
  if (nameLower.includes('natural') || nameLower.includes('online') || nameLower.includes('neural')) score += 100
  if (
    nameLower.includes('jenny') ||
    nameLower.includes('aria') ||
    nameLower.includes('samantha') ||
    nameLower.includes('ava') ||
    nameLower.includes('victoria') ||
    nameLower.includes('zoe')
  ) {
    score += 90
  }
  if (nameLower.includes('enhanced') || nameLower.includes('premium')) score += 80
  if (nameLower.includes('google')) score += 50
  if (nameLower.includes('microsoft')) score += 40
  if (
    nameLower.includes('karen') ||
    nameLower.includes('daniel') ||
    nameLower.includes('alex') ||
    nameLower.includes('fiona')
  ) {
    score += 30
  }

  // Clear standard accents (en-US, en-IN, en-GB)
  if (voice.lang === 'en-US' || voice.lang === 'en-IN' || voice.lang === 'en-GB') score += 20
  if (!voice.localService) score += 10

  return score
}

export function getVoiceForSpeaker(
  speakerName: string,
  map: Map<string, SpeechSynthesisVoice>,
  availVoices: SpeechSynthesisVoice[]
): SpeechSynthesisVoice | null {
  if (map.has(speakerName)) return map.get(speakerName)!

  const englishVoices = availVoices.filter((v) => v.lang.startsWith('en'))
  if (englishVoices.length === 0) return null

  const sorted = [...englishVoices].sort((a, b) => getVoiceQualityScore(b) - getVoiceQualityScore(a))
  const usedVoices = new Set(map.values())
  const unusedVoice = sorted.find((v) => !usedVoices.has(v)) || sorted[map.size % sorted.length]

  if (unusedVoice) {
    map.set(speakerName, unusedVoice)
  }
  return unusedVoice || null
}
