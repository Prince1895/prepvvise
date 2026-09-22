import { AiCodingLearnModule, ValidationResult } from './types'

export function validateAiCodingContentData(moduleData: unknown): ValidationResult {
  const errors: string[] = []

  if (!moduleData || typeof moduleData !== 'object') {
    return { valid: false, errors: ['Module data must be a non-null object.'] }
  }

  const mod = moduleData as Partial<AiCodingLearnModule>

  if (!mod.id || typeof mod.id !== 'string') errors.push('Module missing valid "id".')
  if (!mod.title || typeof mod.title !== 'string') errors.push('Module missing valid "title".')
  if (!Array.isArray(mod.sections)) {
    errors.push('Module "sections" must be an array.')
    return { valid: false, errors }
  }

  const sectionIds = new Set<string>()
  const sectionSlugs = new Set<string>()
  const lessonIds = new Set<string>()
  const lessonSlugs = new Set<string>()

  const validLevels = ['beginner', 'intermediate', 'advanced', 'expert']
  const validBlockTypes = [
    'heading',
    'subheading',
    'paragraph',
    'bulletList',
    'numberedList',
    'code',
    'codeComparison',
    'example',
    'note',
    'warning',
    'tip',
    'steps',
    'table',
    'comparison',
    'workflow',
    'checklist',
    'exercise',
    'quiz',
    'keyTakeaways',
  ]

  mod.sections.forEach((sec, secIdx) => {
    if (!sec.id || typeof sec.id !== 'string') {
      errors.push(`Section at index ${secIdx} missing "id".`)
    } else if (sectionIds.has(sec.id)) {
      errors.push(`Duplicate section ID "${sec.id}".`)
    } else {
      sectionIds.add(sec.id)
    }

    if (!sec.slug || typeof sec.slug !== 'string') {
      errors.push(`Section "${sec.id || secIdx}" missing "slug".`)
    } else if (sectionSlugs.has(sec.slug)) {
      errors.push(`Duplicate section slug "${sec.slug}".`)
    } else {
      sectionSlugs.add(sec.slug)
    }

    if (!sec.title || typeof sec.title !== 'string') {
      errors.push(`Section "${sec.id}" missing "title".`)
    }

    if (!Array.isArray(sec.lessons) || sec.lessons.length === 0) {
      errors.push(`Section "${sec.id}" must contain a non-empty "lessons" array.`)
      return
    }

    sec.lessons.forEach((les, lesIdx) => {
      const lesIdentifier = les.id || `${sec.id}-lesson-${lesIdx}`

      if (!les.id || typeof les.id !== 'string') {
        errors.push(`Lesson at section "${sec.id}" index ${lesIdx} missing "id".`)
      } else if (lessonIds.has(les.id)) {
        errors.push(`Duplicate lesson ID "${les.id}".`)
      } else {
        lessonIds.add(les.id)
      }

      if (!les.slug || typeof les.slug !== 'string') {
        errors.push(`Lesson "${lesIdentifier}" missing "slug".`)
      } else if (lessonSlugs.has(les.slug)) {
        errors.push(`Duplicate lesson slug "${les.slug}".`)
      } else {
        lessonSlugs.add(les.slug)
      }

      if (!les.title || typeof les.title !== 'string') {
        errors.push(`Lesson "${lesIdentifier}" missing "title".`)
      }

      if (!validLevels.includes(les.level)) {
        errors.push(`Lesson "${lesIdentifier}" has invalid level "${les.level}". Must be one of ${validLevels.join(', ')}.`)
      }

      if (typeof les.durationMinutes !== 'number' || les.durationMinutes <= 0) {
        errors.push(`Lesson "${lesIdentifier}" must have positive durationMinutes.`)
      }

      if (!Array.isArray(les.content)) {
        errors.push(`Lesson "${lesIdentifier}" content must be an array.`)
      } else {
        les.content.forEach((block, blockIdx) => {
          if (!block || typeof block !== 'object' || !('type' in block)) {
            errors.push(`Lesson "${lesIdentifier}" block at index ${blockIdx} invalid.`)
            return
          }
          if (!validBlockTypes.includes(block.type)) {
            errors.push(`Lesson "${lesIdentifier}" block at index ${blockIdx} has unknown type "${block.type}".`)
          }
        })
      }

      if (les.quiz) {
        if (!les.quiz.question || !Array.isArray(les.quiz.options)) {
          errors.push(`Lesson "${lesIdentifier}" quiz invalid structure.`)
        } else if (
          typeof les.quiz.answerIndex !== 'number' ||
          les.quiz.answerIndex < 0 ||
          les.quiz.answerIndex >= les.quiz.options.length
        ) {
          errors.push(`Lesson "${lesIdentifier}" quiz answerIndex ${les.quiz.answerIndex} out of bounds for ${les.quiz.options.length} options.`)
        }
      }

      if (les.exercise) {
        if (!les.exercise.title || !les.exercise.description) {
          errors.push(`Lesson "${lesIdentifier}" exercise missing title or description.`)
        }
      }
    })
  })

  return {
    valid: errors.length === 0,
    errors,
  }
}
