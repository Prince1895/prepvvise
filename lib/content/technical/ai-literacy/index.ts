import aiLiteracyData from './learn.json'
import { AILiteracyContentModel, CheatSheet, GlossaryItem, Lesson, Section } from './types'
import { validateAILiteracyContent } from './validator'

export const aiLiteracyContentModel = aiLiteracyData as unknown as AILiteracyContentModel

// Validate on initial import in development environment
if (process.env.NODE_ENV !== 'production') {
  const result = validateAILiteracyContent(aiLiteracyContentModel)
  if (!result.valid) {
    console.warn('[AI Literacy Content Validation Errors]:', result.errors)
  }
}

export function getAILiteracyContent(): AILiteracyContentModel {
  return aiLiteracyContentModel
}

export function getAILiteracySections(): Section[] {
  return aiLiteracyContentModel.sections || []
}

export function getAllAILiteracyLessons(): Lesson[] {
  const lessons: Lesson[] = []
  for (const sec of getAILiteracySections()) {
    if (sec.lessons) {
      lessons.push(...sec.lessons)
    }
  }
  return lessons
}

export function getAILiteracyLessonBySlug(slug: string): Lesson | undefined {
  return getAllAILiteracyLessons().find((l) => l.slug === slug)
}

export function getAILiteracyGlossary(): GlossaryItem[] {
  return aiLiteracyContentModel.glossary || []
}

export function getAILiteracyCheatSheets(): CheatSheet[] {
  return aiLiteracyContentModel.cheatSheets || []
}

export function getAdjacentAILiteracyLessons(currentSlug: string): {
  prevLesson?: Lesson
  nextLesson?: Lesson
  currentIndex: number
  totalLessons: number
  currentSection?: Section
} {
  const all = getAllAILiteracyLessons()
  const currentIndex = all.findIndex((l) => l.slug === currentSlug)

  let currentSection: Section | undefined = undefined
  if (currentIndex !== -1) {
    const targetLesson = all[currentIndex]
    currentSection = getAILiteracySections().find((sec) =>
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
