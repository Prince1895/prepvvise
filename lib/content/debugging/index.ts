import learnContentData from './learn.json'
import { DebuggingLearnModule, Lesson, Section } from './types'

export const debuggingLearnModule = learnContentData as unknown as DebuggingLearnModule

export function getDebuggingLearnContent(): DebuggingLearnModule {
  return debuggingLearnModule
}

export function getDebuggingSections(): Section[] {
  return debuggingLearnModule.sections || []
}

export function getAllLessons(): Lesson[] {
  const lessons: Lesson[] = []
  for (const sec of getDebuggingSections()) {
    if (sec.lessons) {
      lessons.push(...sec.lessons)
    }
  }
  return lessons
}

export function getLessonBySlug(slug: string): Lesson | undefined {
  return getAllLessons().find((l) => l.slug === slug)
}

export function getAdjacentLessons(currentSlug: string): {
  prevLesson?: Lesson
  nextLesson?: Lesson
  currentIndex: number
  totalLessons: number
  currentSection?: Section
} {
  const all = getAllLessons()
  const currentIndex = all.findIndex((l) => l.slug === currentSlug)

  let currentSection: Section | undefined = undefined
  if (currentIndex !== -1) {
    const targetLesson = all[currentIndex]
    currentSection = getDebuggingSections().find((sec) =>
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
