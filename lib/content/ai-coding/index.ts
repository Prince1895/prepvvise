import learnContentData from './learn.json'
import { AiCodingLearnModule, Lesson, Section, ValidationResult } from './types'
import { validateAiCodingContentData } from './validator'

export const aiCodingLearnModule = learnContentData as unknown as AiCodingLearnModule

export function validateAiCodingContent(): ValidationResult {
  return validateAiCodingContentData(aiCodingLearnModule)
}

export function getAiCodingLearnContent(): AiCodingLearnModule {
  return aiCodingLearnModule
}

export function getAiCodingSections(): Section[] {
  return aiCodingLearnModule.sections || []
}

export function getAllAiCodingLessons(): Lesson[] {
  const lessons: Lesson[] = []
  for (const sec of getAiCodingSections()) {
    if (sec.lessons) {
      lessons.push(...sec.lessons)
    }
  }
  return lessons
}

export function getAiCodingLessonBySlug(slug: string): Lesson | undefined {
  return getAllAiCodingLessons().find((l) => l.slug === slug)
}

export function getAdjacentAiCodingLessons(currentSlug: string): {
  prevLesson?: Lesson
  nextLesson?: Lesson
  currentIndex: number
  totalLessons: number
  currentSection?: Section
} {
  const all = getAllAiCodingLessons()
  const currentIndex = all.findIndex((l) => l.slug === currentSlug)

  let currentSection: Section | undefined = undefined
  if (currentIndex !== -1) {
    const targetLesson = all[currentIndex]
    currentSection = getAiCodingSections().find((sec) =>
      sec.lessons?.some((l) => l.id === targetLesson.id || l.slug === targetLesson.slug)
    )
  }

  if (currentIndex === -1) {
    return {
      prevLesson: undefined,
      nextLesson: all[0],
      currentIndex: -1,
      totalLessons: all.length,
      currentSection,
    }
  }

  return {
    prevLesson: currentIndex > 0 ? all[currentIndex - 1] : undefined,
    nextLesson: currentIndex < all.length - 1 ? all[currentIndex + 1] : undefined,
    currentIndex,
    totalLessons: all.length,
    currentSection,
  }
}
